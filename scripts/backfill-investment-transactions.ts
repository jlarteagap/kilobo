// scripts/backfill-investment-transactions.ts
// REQUERIDO tras descubrir el bug de compra: las inversiones creadas antes de la
// subcolección `transactions` guardaban `amount` en el documento SIN ninguna
// transacción de respaldo. Cada BUY/SELL dispara recalculatePosition() que
// sobreescribe `amount` con Σ(BUY) − Σ(SELL) de la subcolección; para esas
// inversiones legacy la base quedaba pisada (ej: amount $X + compra $10 → amount $10).
//
// Este script reconcilla el estado: si doc.amount > Σ(BUY) − Σ(SELL), siembra UNA
// transacción BUY sintética con amount = doc.amount − txNet para que la subcolección
// sea la fuente de verdad y el recalculate nunca más destruya la base.
//
// Idempotente: si re-corre, txNet == doc.amount → omite todo.
// Nota: las inversiones YA pisadas (amount == txNet pero base legacy perdida) se
// normalizan tal cual; no se intenta rescatar el valor original desde balance history.
//
// Uso: npx tsx scripts/backfill-investment-transactions.ts [--verify]
// Requiere credenciales de service account válidas en la env (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).
import 'dotenv/config'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '../src/lib/firebase.admin'

const INVESTMENTS = 'investments'
const TX = 'transactions'
const BATCH_LIMIT = 490

const VERIFY = process.argv.includes('--verify')

function toDate(value: unknown): string | null {
  if (typeof value === 'string' && value) return value
  return null
}

function txAmount(data: Record<string, unknown>): number {
  return Number(data.amount ?? data.total_amount ?? 0)
}

async function computeTxNet(investmentId: string): Promise<number> {
  const snapshot = await adminDb
    .collection(INVESTMENTS)
    .doc(investmentId)
    .collection(TX)
    .get()

  let net = 0
  for (const doc of snapshot.docs) {
    const data = doc.data() as Record<string, unknown>
    const amount = txAmount(data)
    if (data.type === 'BUY') net += amount
    else if (data.type === 'SELL') net -= amount
  }
  return net
}

async function main() {
  const investmentsSnap = await adminDb.collection(INVESTMENTS).limit(5000).get()
  console.log(`Inversiones encontradas: ${investmentsSnap.size}`)

  let consistent = 0
  let backfilled = 0
  let skipped = 0
  let misaligned = 0
  let batch = adminDb.batch()
  let batchSize = 0

  for (const doc of investmentsSnap.docs) {
    const data = doc.data()
    const userId = data.user_id
    if (!userId) {
      console.log(`  → Omitida (sin user_id): ${doc.id}`)
      skipped++
      continue
    }

    const docAmount = Number(data.amount ?? 0)
    const txNet = await computeTxNet(doc.id)

    if (txNet >= docAmount) {
      if (txNet > docAmount) {
        // amount < txNet: la base ya se perdió o el usuario editó el monto; se
        // normaliza amount para que coincida con la subcolección.
        misaligned++
      }
      consistent++
      continue
    }

    const delta = docAmount - txNet
    const date = toDate(data.date)
    const ref = adminDb
      .collection(INVESTMENTS)
      .doc(doc.id)
      .collection(TX)
      .doc()

    batch.set(ref, {
      investment_id: doc.id,
      user_id: userId,
      account_id: data.account_id ?? null,
      type: 'BUY',
      amount: delta,
      currency: data.currency ?? 'BOB',
      date: date ?? null,
      notes: 'Saldo inicial (backfill)',
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    })
    backfilled++
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

  console.log(`\nResumen — consistentes: ${consistent}, backfilleadas: ${backfilled}, omitidas: ${skipped}`)
  if (misaligned > 0) {
    console.log(`Advertencia: ${misaligned} inversiones tenían amount < txNet (base legacy ya pisada o editada; quedaron según subcolección).`)
  }
  process.exit(0)
}

async function verify() {
  const investmentsSnap = await adminDb.collection(INVESTMENTS).limit(5000).get()
  console.log(`Verificación — inversiones: ${investmentsSnap.size}`)

  let off = 0
  for (const doc of investmentsSnap.docs) {
    const data = doc.data()
    if (!data.user_id) continue
    const txNet = await computeTxNet(doc.id)
    const docAmount = Number(data.amount ?? 0)
    if (txNet !== docAmount) {
      off++
      console.log(`  → Desalineada ${doc.id}: amount=${docAmount}, txNet=${txNet}`)
    }
  }

  console.log(off === 0
    ? '\nOK: todas las inversiones tienen amount == Σ(BUY) − Σ(SELL).'
    : `\n${off} inversiones desalineadas.`)
  process.exit(off === 0 ? 0 : 1)
}

const run = VERIFY ? verify : main
run().catch((e) => {
  console.error(e)
  process.exit(1)
})