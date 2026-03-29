// scripts/remove-trabajo-category.ts
import { config } from 'dotenv'
config({ path: '.env' })

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// ─── Validación ───────────────────────────────────────────────────────────────
const projectId   = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Faltan variables de entorno:')
  if (!projectId)   console.error('  - NEXT_PUBLIC_FIREBASE_PROJECT_ID')
  if (!clientEmail) console.error('  - FIREBASE_CLIENT_EMAIL')
  if (!privateKey)  console.error('  - FIREBASE_PRIVATE_KEY')
  process.exit(1)
}

// ─── Init Firebase ────────────────────────────────────────────────────────────
const app = getApps().length === 0
  ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  : getApps()[0]

const db = getFirestore(app)

// ─── Main ─────────────────────────────────────────────────────────────────────
async function migrate() {
  console.log('\n🚀 Iniciando limpieza de categoría "trabajo"...\n')

  // ── Paso 1: Encontrar el ID real de "trabajo" en la colección category ────
  console.log('🔍 Paso 1/2: Buscando categoría "trabajo"...')

  const categorySnap = await db.collection('category')
    .where('name', '==', 'trabajo')
    .get()

  if (categorySnap.empty) {
    // Intentar case-insensitive buscando variantes comunes
    console.warn('  ⚠️  No se encontró con name == "trabajo", probando "Trabajo"...')
    const retrySnap = await db.collection('category')
      .where('name', '==', 'Trabajo')
      .get()

    if (retrySnap.empty) {
      console.error('  ❌ No se encontró ninguna categoría llamada "trabajo" o "Trabajo".')
      console.error('     Verificá el nombre exacto en Firestore y ajustá el script.')
      process.exit(1)
    }
  }

  // Puede haber más de un doc con ese nombre — los procesamos todos
  const trabajoIds = new Set<string>()
  const finalSnap  = categorySnap.empty
    ? await db.collection('category').where('name', '==', 'Trabajo').get()
    : categorySnap

  finalSnap.docs.forEach((doc) => {
    trabajoIds.add(doc.id)
    console.log(`  ✓ Encontrado: id="${doc.id}" name="${doc.data().name}"`)
  })

  console.log(`\n  Total IDs a limpiar: ${trabajoIds.size}\n`)

  // ── Paso 2: Limpiar transacciones que referencian esos IDs ───────────────
  console.log('📝 Paso 2/2: Limpiando transacciones...')

  const transactionsSnap = await db.collection('transactions').get()

  const affected = transactionsSnap.docs.filter((doc) =>
    trabajoIds.has(doc.data().category_id)
  )

  console.log(`  Transacciones afectadas: ${affected.length}`)

  if (affected.length === 0) {
    console.log('\n✅ No hay transacciones que referencien esta categoría. Nada que hacer.')
    return
  }

  // Preview antes de escribir
  console.log('\n─── PREVIEW ──────────────────────────────────────────')
  affected.slice(0, 10).forEach((doc) => {
    const d = doc.data()
    console.log(`  tx ${doc.id} | fecha: ${d.date} | monto: ${d.amount} | category_id: "${d.category_id}" → DELETE`)
  })
  if (affected.length > 10) {
    console.log(`  ... y ${affected.length - 10} más`)
  }
  console.log('──────────────────────────────────────────────────────\n')

  // Escribir en batches de 400
  let batch    = db.batch()
  let opCount  = 0
  let batches  = 0

  for (const doc of affected) {
    batch.update(doc.ref, {
      category_id:  FieldValue.delete(),   // ← elimina el campo del documento
      updated_at:   new Date().toISOString(),
    })
    opCount++

    if (opCount >= 400) {
      await batch.commit()
      batch   = db.batch()
      opCount = 0
      batches++
      console.log(`  ✓ Batch ${batches} commiteado`)
    }
  }

  if (opCount > 0) {
    await batch.commit()
    batches++
  }

  console.log(`\n✅ Limpieza completada.`)
  console.log(`   Transacciones actualizadas: ${affected.length}`)
  console.log(`   Batches ejecutados:         ${batches}`)
}

migrate().catch((err) => {
  console.error('\n❌ Error en el script:', err)
  process.exit(1)
})