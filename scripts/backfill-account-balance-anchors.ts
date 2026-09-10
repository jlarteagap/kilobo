// scripts/backfill-account-balance-anchors.ts
// REQUERIDO tras el deploy: siembra una "ancla" (registro de cambio de balance) para cada cuenta
// que aún no tenga ningún cambio ANTERIOR al inicio del periodo diario (4:00 AM). Sin esa ancla
// previa, el badge de variación diaria no puede calcular delta y no se visualiza.
//
// Idempotencia correcta: NO omite cuentas con historial reciente (ese bug dejaba sin ancla a
// cuentas cuyo primer día de actividad era hoy). Omite solo si YA existe un cambio previo al
// límite del periodo; a las demás les siembra una ancla con el balance de APERTURA del día:
//   apertura = balance actual − Σ(deltas de los cambios de hoy)
// Semilla: previous_balance = new_balance = apertura (delta 0), source 'ACCOUNT'.
//
// Uso: npx tsx scripts/backfill-account-balance-anchors.ts
// Requiere credenciales de service account válidas en la env (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).
import 'dotenv/config'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '../src/lib/firebase.admin'
import { startOfDailyPeriod } from '../src/features/accounts/utils/daily-period.utils'

const ACCOUNTS = 'accounts'
const CHANGES = 'account_balance_changes'
const BATCH_LIMIT = 490
const DAY_SCAN_LIMIT = 200

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

async function hasAnchorBefore(userId: string, accountId: string, before: Date): Promise<boolean> {
  const snapshot = await adminDb
    .collection(CHANGES)
    .where('user_id', '==', userId)
    .where('account_id', '==', accountId)
    .where('createdAt', '<', before)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get()
  return !snapshot.empty
}

// Suma los deltas de los cambios registrados hoy (>= límite del periodo) y devuelve
// { sumDelta, latestNewBalance, earliest } o null si no hay actividad de hoy.
async function todayActivity(
  userId: string,
  accountId: string,
  from: Date
): Promise<{ sumDelta: number; latestNewBalance: number; earliest: Timestamp } | null> {
  const snapshot = await adminDb
    .collection(CHANGES)
    .where('user_id', '==', userId)
    .where('account_id', '==', accountId)
    .where('createdAt', '>=', from)
    .orderBy('createdAt', 'desc')
    .limit(DAY_SCAN_LIMIT)
    .get()

  if (snapshot.empty) return null

  const docs = snapshot.docs
  const sumDelta = docs.reduce((sum, doc) => sum + Number(doc.data().delta ?? 0), 0)
  return {
    sumDelta,
    latestNewBalance: Number(docs[0].data().new_balance ?? 0),
    earliest: toTimestamp(docs[docs.length - 1].data().createdAt),
  }
}

async function main() {
  const accountsSnap = await adminDb.collection(ACCOUNTS).limit(1000).get()
  console.log(`Cuentas encontradas: ${accountsSnap.size}`)

  const before = startOfDailyPeriod()

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

    if (await hasAnchorBefore(userId, doc.id, before)) {
      // Ya existe un cambio previo al periodo: el badge ya puede calcular delta.
      skipped++
      continue
    }

    const activity = await todayActivity(userId, doc.id, before)
    let anchorBalance = Number(data.balance ?? 0)
    let anchorCreatedAt = toTimestamp(data.createdAt)

    if (activity) {
      // Cuenta con actividad de hoy pero sin ancla previa: apertura reconstruida.
      anchorBalance = activity.latestNewBalance - activity.sumDelta
      anchorCreatedAt = anchorCreatedAt < new Timestamp(before.getTime() / 1000, 0)
        ? anchorCreatedAt
        : activity.earliest
    } else if (anchorCreatedAt >= new Timestamp(before.getTime() / 1000, 0)) {
      // Sin cambios previos ni de hoy y creada dentro del periodo actual: sin
      // ancla esperada (el badge aparece recién mañana).
      console.log(`  → Omitida (creada hoy, sin ancla esperada): ${doc.id}`)
      skipped++
      continue
    }

    batch.set(adminDb.collection(CHANGES).doc(), {
      user_id: userId,
      account_id: doc.id,
      previous_balance: anchorBalance,
      new_balance: anchorBalance,
      delta: 0,
      source: 'ACCOUNT',
      createdAt: anchorCreatedAt,
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

  console.log(`\nResumen — sembradas: ${seeded}, omitidas: ${skipped}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})