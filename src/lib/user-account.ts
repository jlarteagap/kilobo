import { adminDb, adminAuth } from './firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'
import { OWNED_COLLECTION_NAMES, USER_COLLECTIONS } from './user-data'

/** Firestore admite 500 operaciones por batch; 400 deja margen. */
const BATCH_SIZE = 400

export interface DeletionReport {
  collection: string
  deleted: number
  ok: boolean
  error?: string
}

/**
 * Borra los documentos que pertenecen al usuario en una colección, por lotes y
 * con paginación. No usa `limit()` porque el volumen es desconocido y no debe
 * dejar huérfanos.
 *
 * Las subcolecciones NO las borra Firestore en cascada, así que se recorren
 * explícitamente antes de eliminar el padre: si el padre desaparece primero, la
 * ruta de la subcolección deja de ser direccionable y sus datos quedan
 * huérfanos para siempre.
 */
async function deleteFromCollection(
  collectionName: string,
  userId: string,
  subcollections: string[] = [],
): Promise<number> {
  let deleted = 0

  for (;;) {
    const col = adminDb.collection(collectionName)
    const snap = await col.where('user_id', '==', userId).limit(BATCH_SIZE).get()
    if (snap.empty) break

    // Primero las subcolecciones de cada documento de este lote.
    for (const doc of snap.docs) {
      for (const sub of subcollections) {
        deleted += await deleteSubcollection(doc.ref.collection(sub))
      }
    }

    const batch = adminDb.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    deleted += snap.size
  }

  return deleted
}

async function deleteSubcollection(subCol: FirebaseFirestore.CollectionReference): Promise<number> {
  let deleted = 0
  for (;;) {
    const snap = await subCol.limit(BATCH_SIZE).get()
    if (snap.empty) break
    const batch = adminDb.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    deleted += snap.size
  }
  return deleted
}

/**
 * Supresión completa de los datos de un usuario.
 *
 * Devuelve un informe por colección en lugar de un único booleano: un borrado
 * parcial debe ser visible y reanudable, nunca silencioso. Una colección que
 * falle no impide que las demás se limpien.
 */
export async function deleteAllUserData(userId: string): Promise<DeletionReport[]> {
  const report: DeletionReport[] = []

  for (const { name, subcollections } of USER_COLLECTIONS) {
    try {
      const deleted = await deleteFromCollection(name, userId, subcollections)
      report.push({ collection: name, deleted, ok: true })
    } catch (error: unknown) {
      report.push({
        collection: name,
        deleted: 0,
        ok: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  return report
}

/**
 * Elimina la cuenta y sus datos, y revoca las sesiones.
 *
 * El orden importa: primero los datos, después la identidad. Si se borrara la
 * identidad primero y el borrado fallara, el usuario perdería el acceso a datos
 * que ya no puede eliminar.
 */
export async function deleteAccount(userId: string): Promise<DeletionReport[]> {
  const report = await deleteAllUserData(userId)

  const failed = report.filter((r) => !r.ok)
  if (failed.length > 0) {
    console.error(
      `[deleteAccount] ${failed.length} colecciones no se pudieron limpiar:`,
      failed.map((f) => f.collection),
    )
    return report
  }

  await adminAuth.deleteUser(userId)
  await revokeAllSessions(userId)

  return report
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await adminDb.collection('users').doc(userId).set(
    { session_revoked_at: FieldValue.serverTimestamp() },
    { merge: true },
  )
}

// ─── Exportación ──────────────────────────────────────────────────────────────

/**
 * Exporta los datos del propio usuario.
 *
 * Se consulta colección por colección con el filtro `user_id`, así que no hay
 * forma de que se混入 datos de otra cuenta: el filtro se aplica en la base de
 * datos, no después.
 */
export async function exportUserData(userId: string): Promise<Record<string, unknown[]>> {
  const out: Record<string, unknown[]> = {}

  for (const { name, subcollections } of USER_COLLECTIONS) {
    const snap = await adminDb.collection(name).where('user_id', '==', userId).get()
    const docs = snap.docs.map((d) => ({ id: d.id, ...serialize(d.data()) }))

    for (const sub of subcollections ?? []) {
      const subDocs: unknown[] = []
      for (const doc of snap.docs) {
        const subSnap = await doc.ref.collection(sub).get()
        subSnap.docs.forEach((d) =>
          subDocs.push({ id: d.id, parent_id: doc.id, ...serialize(d.data()) }),
        )
      }
      out[`${name}/${sub}`] = subDocs
    }

    out[name] = docs
  }

  return out
}

/**
 * Los Timestamps de Firestore no son JSON-serializables y romperían el
 * `JSON.stringify` de la respuesta. Se pasan a ISO.
 */
function serialize(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate?: unknown }).toDate === 'function') {
      out[k] = (v as { toDate: () => Date }).toDate().toISOString()
    } else {
      out[k] = v
    }
  }
  return out
}

export { OWNED_COLLECTION_NAMES }