// scripts/backfill-shift-maintenance.ts
// Requerido tras corregir el bug de persistencia: los turnos creados antes del fix
// NO guardaban `maintenanceReserve` en Firestore (la reserva se calculaba y se registraba
// la transacción, pero el campo no se persistía), así que el historial y las tarjetas
// de Mantenimiento mostraban 0.
//
// Este script recomputa `maintenanceReserve` y `liquidEarnings` con la misma fórmula del
// servicio (6% del neto pre-mantenimiento) solo para los turnos que no tienen el campo.
//
// Uso: npx tsx scripts/backfill-shift-maintenance.ts
import 'dotenv/config'
import { adminDb } from '../src/lib/firebase.admin'
import { DRIVER_APPS, sumTips } from '../src/types/driver'

const SHIFTS = 'driver_shifts'
const BATCH_LIMIT = 490

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && isFinite(value) ? value : 0
}

function computeMetrics(data: Record<string, unknown>) {
  const earnings = (data.earnings ?? {}) as Record<string, Record<string, number>>
  const cashEarnings = DRIVER_APPS.reduce((s, app) => s + toNumber(earnings[app]?.CASH), 0)
  const qrEarnings = DRIVER_APPS.reduce((s, app) => s + toNumber(earnings[app]?.QR), 0)

  const commissions = (data.commissions ?? {}) as Record<string, number>
  const totalCommissions = Object.values(commissions).reduce((s, v) => s + toNumber(v), 0)

  const expenses = Array.isArray(data.expenses) ? (data.expenses as Array<{ amount?: number }>) : []
  const totalExpenses = expenses.reduce((s, e) => s + toNumber(e.amount), 0)

  const totalTips = sumTips((data.tips ?? {}) as never)

  const preMaintenanceLiquid = cashEarnings + qrEarnings + totalTips - totalCommissions - totalExpenses
  const maintenanceReserve = preMaintenanceLiquid > 0 ? round2(preMaintenanceLiquid * 0.06) : 0
  const liquidEarnings = round2(preMaintenanceLiquid - maintenanceReserve)

  return { liquidEarnings, maintenanceReserve }
}

async function main() {
  const snapshot = await adminDb.collection(SHIFTS).get()
  console.log(`Turnos encontrados: ${snapshot.docs.length}`)

  let updated = 0
  let skipped = 0
  let batch = adminDb.batch()
  let batchSize = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()
    if (typeof data.maintenanceReserve === 'number') {
      skipped++
      continue
    }

    const { liquidEarnings, maintenanceReserve } = computeMetrics(data)

    batch.update(doc.ref, { liquidEarnings, maintenanceReserve })
    updated++
    batchSize++

    if (batchSize >= BATCH_LIMIT) {
      await batch.commit()
      console.log(`  → Commit de batch (${batchSize} turnos)`)
      batch = adminDb.batch()
      batchSize = 0
    }
  }

  if (batchSize > 0) {
    await batch.commit()
    console.log(`  → Commit final (${batchSize} turnos)`)
  }

  console.log(`\nResumen — actualizados: ${updated}, sin cambios: ${skipped}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})