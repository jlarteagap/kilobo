import type { CarCycle } from '@/types/car-sharing'
import { cycleLitersPer100, cycleKm, round2 } from '@/types/car-sharing'
import type { CarMaintenanceLog, MaintenanceType } from '@/types/car-maintenance'
import { MAINTENANCE_TYPE_LABELS } from '@/types/car-maintenance'
import { formatBs, formatLiters } from '@/app/gasolina/utils/format'

export interface TimelineEntry {
  id: string
  at: number
  kind: 'cycle' | 'maintenance'
  title: string
  detail: string
  /** Solo en ciclos con litros: el dato que hace comparable la serie. */
  litersPer100?: number
  amount?: number
}

/**
 * Linea de tiempo que mezcla las cargas de gasolina con los servicios del auto.
 *
 * El objetivo es responder una sola pregunta: si el consumo empeoró despues de
 * un cambio. Con los bloques separados no hay forma de ver si el aditivo de
 * inyectores sirvio de algo, porque el gasto y el mantenimiento nunca aparecen
 * uno al lado del otro.
 *
 * Cada mantenimiento se anota con el promedio de L/100km de los `maintenanceBefore`
 * ciclos cerrados posteriores, que es el indicador observable del efecto.
 */
export function buildTimeline(
  cycles: CarCycle[],
  logs: CarMaintenanceLog[],
  opts: { maintenanceBefore: number },
): TimelineEntry[] {
  const entries: TimelineEntry[] = []

  cycles.forEach(cycle => {
    if (cycle.status !== 'closed' || !cycle.endDate) return

    const litersPer100 = cycleLitersPer100(cycle)
    entries.push({
      id: cycle.id,
      at: cycle.endDate,
      kind: 'cycle',
      title: 'Carga de gasolina',
      detail: [
        formatBs(cycle.gasAmount),
        `${cycleKm(cycle)} km`,
        formatLiters(cycle.gasLiters ?? null),
      ]
        .filter(v => v && v !== '—')
        .join(' · '),
      litersPer100: litersPer100 ?? undefined,
      amount: cycle.gasAmount,
    })
  })

  logs.forEach(log => {
    const type: MaintenanceType = log.type
    entries.push({
      id: log.id,
      at: log.date,
      kind: 'maintenance',
      title: MAINTENANCE_TYPE_LABELS[type] ?? 'Mantenimiento',
      detail: [
        `${log.odometer} km`,
        typeof log.cost === 'number' ? formatBs(log.cost) : null,
      ]
        .filter(Boolean)
        .join(' · '),
    })
  })

  // Mas reciente primero.
  entries.sort((a, b) => b.at - a.at)

  // Anota cada mantenimiento con el promedio de L/100km de los `maintenanceBefore`
  // ciclos siguientes, o `null` si todavia no hay datos suficientes para judging.
  const withMetrics = cycles
    .filter(c => c.status === 'closed' && c.endDate && cycleLitersPer100(c) !== null)
    .sort((a, b) => (a.endDate as number) - (b.endDate as number))

  const byKind = new Map<string, TimelineEntry>()
  entries.filter(e => e.kind === 'maintenance').forEach(e => byKind.set(e.id, e))

  logs.forEach(log => {
    const entry = byKind.get(log.id)
    if (!entry) return

    const position = withMetrics.findIndex(c => (c.endDate as number) > log.date)
    const after =
      position === -1 ? [] : withMetrics.slice(position, position + opts.maintenanceBefore)

    if (after.length < opts.maintenanceBefore) {
      // Distinguir "no hay ciclos" de "los hay pero sin litros" importa: son
      // señales opuestas. Hoy el unico ciclo cerrado no tiene litros, asi que
      // un mensaje generico haria creer que falta data cuando lo que falta es
      // llenar un campo.
      const closedAfter = cycles.filter(
        c => c.status === 'closed' && c.endDate !== null && c.endDate > log.date,
      ).length

      if (closedAfter === 0) {
        entry.detail += ' · sin ciclos siguientes todavia'
      } else if (withMetrics.length === 0) {
        entry.detail += ' · sin litros registrados en los ciclos siguientes'
      } else {
        const got = after.length
        entry.detail +=
          got === 0
            ? ' · los ciclos siguientes no tienen litros'
            : ` · solo ${got} ciclo${got > 1 ? 's' : ''} siguiente${got > 1 ? 's' : ''} comparable${got > 1 ? 's' : ''}`
      }
      return
    }

    // Solo se promedia contra ciclos comparable (litros + km en rango util);
    // mezclar un ciclo de 600 km sin litros haria que el numero mienta.
    const avg = after.reduce((acc, c) => acc + (cycleLitersPer100(c) as number), 0) / after.length
    entry.litersPer100 = round2(avg)
    entry.detail += ` · ${entry.litersPer100} L/100km en los ${opts.maintenanceBefore} siguientes`
  })

  return entries
}