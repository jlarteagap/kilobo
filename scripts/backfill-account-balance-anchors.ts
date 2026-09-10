// scripts/backfill-account-balance-anchors.ts
// REQUERIDO tras el deploy: siembra una "ancla" (registro de cambio de balance) para cada cuenta
// que aún no tenga historial. Sin esta ancla previa al inicio del periodo diario (4:00 AM), el
// badge de variación diaria no puede calcular delta y no se visualiza.
//
// Semilla: previous_balance = new_balance = balance actual (delta 0), source 'ACCOUNT', con la
// fecha de creación de la cuenta como timestamp de la ancla.
// Idempotente: omite cuentas que ya tengan al menos un registro.
//
// Uso: npx tsx scripts/backfill-account-balance-anchors.ts
// Requiere credenciales de service account válidas en la env (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).
import 'dotenv/config'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '../src/lib/firebase.admin'

const ACCOUNTS = 'accounts'
const CHANGES = 'account_balance_changes'
const BATCH_LIMIT = 490

function toTimestamp(value: unknown): Timestamp {
  if (value instanceof Timestamp) return value
  if (value instanceof Date) return Timestamp.fromDate(value)
  if (typeof value === 'object' && value && 'seconds' in value) {
    const seconds = Number((value as { seconds: number }).seconds)
    const nanoseconds = Number((value as { nanoseconds?: number }).nanoseconds ?? 0)
    return new Timestamp(seconds, nanoseconds)
  }
  return Timestamp.now()
}

async function main() {
  const accountsSnap = await adminDb.collection(ACCOUNTS).limit(1000).get()
  console.log(`Cuentas encontradas: ${accountsSnap.size}`)

  let seeded = 0
  let skipped = 0
  let batch = adminDb.batch()
  let batchSize = 0

  for (const doc of accountsSnap.docs) {
    const data = doc.data()
    const userId = data.user_id
    if (!userId) {
      console.log(`  → Omitida (sin user_id): ${doc.id}`)
      skipped++
      continue
    }

    const existing = await adminDb
      .collection(CHANGES)
      .where('account_id', '==', doc.id)
      .limit(1)
      .get()
    if (!existing.empty) {
      skipped++
      continue
    }

    const balance = Number(data.balance ?? 0)
    const createdAt = toTimestamp(data.createdAt)

    batch.set(adminDb.collection(CHANGES).doc(), {
      user_id: userId,
      account_id: doc.id,
      previous_balance: balance,
      new_balance: balance,
      delta: 0,
      source: 'ACCOUNT',
      createdAt,
    })
    seeded++
    batchSize++

    if (batchSize >= BATCH_LIMIT) {
      await batch.commit()
      console.log(`  → Commit de batch (${batchSize} semillas)`)
      batch = adminDb.batch()
      batchSize = 0
    }
  }

  if (batchSize > 0) {
    await batch.commit()
    console.log(`  → Commit final (${batchSize} semillas)`)
  }

  console.log(`\nResumen — sembradas: ${seeded}, omitidas (ya con historial o sin user_id): ${skipped}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})