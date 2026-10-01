// scripts/backfill-shift-maintenance.ts
// Requerido tras corregir el bug de persistencia: los turnos creados antes del fix
// NO guardaban `maintenanceReserve` en Firestore (la reserva se calculaba y se registraba
// la transacción, pero el campo no se persistía), así que el historial y las tarjetas
// de Mantenimiento mostraban 0.
//
// Este script recomputa `maintenanceReserve` y `liquidEarnings` con la MISMA función que
// usa el servicio en runtime (`computeShiftMetrics`), para que un rerun no escriba
// cifras con una fórmula distinta a la de los turnos nuevos.
//
// Uso: npx tsx scripts/backfill-shift-maintenance.ts
import 'dotenv/config'
import { adminDb } from '../src/lib/firebase.admin'
import { computeShiftMetrics } from '../src/types/driver'

const SHIFTS = 'driver_shifts'
const BATCH_LIMIT = 490

function computeMetrics(data: Record<string, unknown>) {
  const { liquidEarnings, maintenanceReserve } = computeShiftMetrics({
    earnings: (data.earnings ?? {}) as never,
    bonuses: (data.bonuses ?? {}) as never,
    commissions: (data.commissions ?? {}) as never,
    tips: (data.tips ?? {}) as never,
    expenses: (Array.isArray(data.expenses) ? data.expenses : []) as never,
  })

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