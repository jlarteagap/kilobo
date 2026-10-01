import { useMemo } from 'react'
import type { DriverShift } from '@/types/driver'
import { isoToLocalDateStr } from '../utils/driver-metrics.utils'

export interface ShiftPeriodBucket {
  liquid: number
  maintenance: number
  hours: number
  km: number
  shifts: number
}

export interface ShiftPeriodStats {
  today: ShiftPeriodBucket
  week: ShiftPeriodBucket
  month: ShiftPeriodBucket
  lastShift: DriverShift | null
  avgPerShift: number
}

function emptyBucket(): ShiftPeriodBucket {
  return { liquid: 0, maintenance: 0, hours: 0, km: 0, shifts: 0 }
}

function accumulate(bucket: ShiftPeriodBucket, shift: DriverShift) {
  bucket.liquid += shift.liquidEarnings ?? 0
  bucket.maintenance += shift.maintenanceReserve ?? 0
  bucket.hours += shift.hoursWorked ?? 0
  bucket.km += shift.totalKm ?? 0
  bucket.shifts += 1
}

/** "YYYY-MM-DD" en hora local, para no correr el dia por el offset de UTC. */
function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Lunes de la semana en curso, en "YYYY-MM-DD". */
function startOfWeekStr(now: Date): string {
  const start = new Date(now)
  const day = start.getDay()
  start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day))
  return localDateStr(start)
}

/**
 * Agrega los turnos en tres ventanas: hoy, la semana en curso y el mes en curso.
 *
 * `DashboardSummary` (dentro de `/conductor`) y `DriverWidget` (en el dashboard)
 * tenian cada uno su propia copia de este calculo, y ya se habian desincronizado:
 * el widget no contaba la reserva de mantenimiento, asi que las dos paginas
 * mostraban numeros distintos del mismo dato.
 */
export function useShiftPeriodStats(shifts: DriverShift[]): ShiftPeriodStats {
  return useMemo(() => {
    const now = new Date()
    const todayStr = localDateStr(now)
    const weekStart = startOfWeekStr(now)
    const monthPrefix = todayStr.slice(0, 7)

    const today = emptyBucket()
    const week = emptyBucket()
    const month = emptyBucket()
    let lastShift: DriverShift | null = null

    for (const shift of shifts) {
      const day = (shift.date ?? isoToLocalDateStr(shift.createdAt) ?? '').slice(0, 10)
      if (!day) continue

      if (day === todayStr) accumulate(today, shift)
      if (day >= weekStart) accumulate(week, shift)
      if (day.startsWith(monthPrefix)) accumulate(month, shift)

      if (!lastShift || day > (lastShift.date ?? '').slice(0, 10)) lastShift = shift
    }

    const totalLiquid = shifts.reduce((s, sh) => s + (sh.liquidEarnings ?? 0), 0)
    const avgPerShift = shifts.length > 0 ? totalLiquid / shifts.length : 0

    return { today, week, month, lastShift, avgPerShift }
  }, [shifts])
}