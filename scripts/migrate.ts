// scripts/migrate.ts
import { config } from 'dotenv'
config({ path: '.env' })

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

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

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface CategoryDoc {
  id: string
  name: string
  parent_id: string | null
  tags?: string[]
  type: string
  icon?: string
}

interface TransactionDoc {
  id: string
  category_id: string
}

function normalize(name: string): string {
  return name.trim().toLowerCase()
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function migrate() {
  console.log('\n🚀 Iniciando migración de subcategorías a tags...\n')

  const categoriesSnap = await db.collection('category').get()
  const allCategories: CategoryDoc[] = categoriesSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<CategoryDoc, 'id'>),
  }))

  const subcategories = allCategories.filter((c) => c.parent_id)
  const parentMap = new Map(
    allCategories.filter((c) => !c.parent_id).map((c) => [c.id, c])
  )

  console.log(`📦 Total categorías:       ${allCategories.length}`)
  console.log(`📂 Subcategorías a migrar: ${subcategories.length}\n`)

  if (subcategories.length === 0) {
    console.log('✅ No hay subcategorías que migrar.')
    return
  }

  // Preview
  console.log('─── PREVIEW ──────────────────────────────────────────')
  for (const sub of subcategories) {
    const parent = parentMap.get(sub.parent_id!)
    console.log(`  "${sub.name}"  →  tag en "${parent?.name ?? '⚠️ PADRE NO ENCONTRADO'}"`)
  }
  console.log('──────────────────────────────────────────────────────\n')

  const transactionsSnap = await db.collection('transactions').get()
  const allTransactions: TransactionDoc[] = transactionsSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<TransactionDoc, 'id'>),
  }))

  const subIds = new Set(subcategories.map((s) => s.id))
  const affectedTransactions = allTransactions.filter((t) => subIds.has(t.category_id))

  console.log(`💳 Transacciones afectadas: ${affectedTransactions.length}\n`)

  let batch = db.batch()
  let opCount = 0
  let batchCount = 0

  const flushIfNeeded = async () => {
    if (opCount >= 400) {
      await batch.commit()
      batch = db.batch()
      opCount = 0
      batchCount++
    }
  }

  // ── Paso 1: Tags en categorías padre ──────────────────────────────────────
  console.log('📝 Paso 1/3: Añadiendo tags a categorías padre...')

  const tagsByParent = new Map<string, string[]>()
  for (const sub of subcategories) {
    const existing = tagsByParent.get(sub.parent_id!) ?? []
    const tag = normalize(sub.name)
    if (!existing.includes(tag)) existing.push(tag)
    tagsByParent.set(sub.parent_id!, existing)
  }

  for (const [parentId, newTags] of tagsByParent.entries()) {
    const parent = parentMap.get(parentId)
    if (!parent) { console.warn(`  ⚠️  Padre no encontrado: ${parentId}`); continue }

    const mergedTags = Array.from(new Set([...(parent.tags ?? []), ...newTags]))
    batch.update(db.collection('category').doc(parentId), {
      tags: mergedTags,
      updated_at: new Date().toISOString(),
    })
    opCount++
    console.log(`  ✓ "${parent.name}" → tags: [${mergedTags.join(', ')}]`)
    await flushIfNeeded()
  }

  // ── Paso 2: Actualizar transacciones ──────────────────────────────────────
  console.log('\n📝 Paso 2/3: Actualizando transacciones...')

  const subToParent = new Map(
    subcategories.map((s) => [s.id, { parentId: s.parent_id!, tagName: normalize(s.name) }])
  )

  for (const transaction of affectedTransactions) {
    const mapping = subToParent.get(transaction.category_id)
    if (!mapping) continue

    batch.update(db.collection('transactions').doc(transaction.id), {
      category_id: mapping.parentId,
      tag: mapping.tagName,
      updated_at: new Date().toISOString(),
    })
    opCount++
    console.log(`  ✓ tx ${transaction.id} → category: "${mapping.parentId}", tag: "${mapping.tagName}"`)
    await flushIfNeeded()
  }

  // ── Paso 3: Marcar subcategorías como migradas ────────────────────────────
  console.log('\n📝 Paso 3/3: Marcando subcategorías como migradas...')

  for (const sub of subcategories) {
    batch.update(db.collection('category').doc(sub.id), {
      _migrated: true,
      updated_at: new Date().toISOString(),
    })
    opCount++
    console.log(`  ✓ "${sub.name}" → _migrated: true`)
    await flushIfNeeded()
  }

  if (opCount > 0) {
    await batch.commit()
    batchCount++
  }

  console.log(`\n✅ Migración completada.`)
  console.log(`   Batches ejecutados:            ${batchCount}`)
  console.log(`   Categorías padre actualizadas: ${tagsByParent.size}`)
  console.log(`   Transacciones actualizadas:    ${affectedTransactions.length}`)
  console.log(`   Subcategorías marcadas:        ${subcategories.length}`)
}

migrate().catch((err) => {
  console.error('❌ Error en la migración:', err)
  process.exit(1)
})