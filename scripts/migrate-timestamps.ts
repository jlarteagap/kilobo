// scripts/migrate.ts
import { config } from 'dotenv'
config({ path: '.env' })

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

// ─── Validación ───────────────────────────────────────────────────────────────
const projectId  = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Faltan variables. Faltantes:')
  if (!projectId)    console.error('  - NEXT_PUBLIC_FIREBASE_PROJECT_ID')
  if (!clientEmail)  console.error('  - FIREBASE_CLIENT_EMAIL')
  if (!privateKey)   console.error('  - FIREBASE_PRIVATE_KEY')
  process.exit(1)
}


// ─── Init Firebase ────────────────────────────────────────────────────────────
const app = getApps().length === 0
  ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  : getApps()[0]

const db = getFirestore(app)

// ─── Helper ───────────────────────────────────────────────────────────────────
function toISOString(value: unknown): string | null {
  if (!value) return null

  // Firestore Timestamp nativo
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  // Objeto plano { _seconds, _nanoseconds }
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    return new Date((value as any)._seconds * 1000).toISOString()
  }

  // Ya es string — no necesita conversión
  if (typeof value === 'string') return value

  return null
}

// ─── Script principal ─────────────────────────────────────────────────────────
async function migrateTimestamps() {
  const snapshot = await db.collection('transactions').get()

  console.log(`📦 Total documentos encontrados: ${snapshot.docs.length}`)

  let updated  = 0
  let skipped  = 0
  let errors   = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()

    const createdAt = data.created_at
    const updatedAt = data.updated_at

    const needsMigration =
      (createdAt instanceof Timestamp) ||
      (updatedAt instanceof Timestamp) ||
      (typeof createdAt === 'object' && createdAt !== null && '_seconds' in createdAt) ||
      (typeof updatedAt === 'object' && updatedAt !== null && '_seconds' in updatedAt)

    if (!needsMigration) {
      skipped++
      continue
    }

    try {
      const updates: Record<string, string> = {}

      const isoCreatedAt = toISOString(createdAt)
      const isoUpdatedAt = toISOString(updatedAt)

      if (isoCreatedAt) updates.created_at = isoCreatedAt
      if (isoUpdatedAt) updates.updated_at = isoUpdatedAt

      await doc.ref.update(updates)

      console.log(`✅ ${doc.id} — created_at: ${isoCreatedAt}`)
      updated++
    } catch (error) {
      console.error(`❌ Error en ${doc.id}:`, error)
      errors++
    }
  }

  console.log('\n─── Resumen ───────────────────────────────')
  console.log(`✅ Actualizados: ${updated}`)
  console.log(`⏭  Sin cambios:  ${skipped}`)
  console.log(`❌ Errores:      ${errors}`)
  console.log('───────────────────────────────────────────')
}

migrateTimestamps()
  .then(() => {
    console.log('\n🎉 Migración completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migración fallida:', error)
    process.exit(1)
  })