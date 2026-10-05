import { round2 } from '@/types/car-sharing'

const BS_FORMAT = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const BS_COMPACT = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const DATE_PARTS = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/La_Paz',
})

const TIME_PARTS = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/La_Paz',
})

const MONTH_FORMAT = new Intl.DateTimeFormat('es-ES', {
  month: 'short',
  timeZone: 'America/La_Paz',
})

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  timeZone: 'America/La_Paz',
})

/**
 * Bolivia es UTC-4 todo el ano, asi que fijar la zona hace que servidor y
 * cliente rendericen el mismo dia. Sin esto, `toLocaleDateString` sin zona
 * devuelve el dia siguiente en el servidor y el correcto en el navegador.
 */
function parts(ts: number): { day: string; month: string } {
  const parts = DATE_PARTS.formatToParts(new Date(ts))
  return {
    day: parts.find(p => p.type === 'day')?.value ?? '00',
    month: parts.find(p => p.type === 'month')?.value ?? '00',
  }
}

export function formatBs(amount: number | null): string {
  if (amount === null || !Number.isFinite(amount)) return '—'
  return BS_FORMAT.format(round2(amount))
}

export function formatBsCompact(amount: number | null): string {
  if (amount === null || !Number.isFinite(amount)) return '—'
  return `Bs ${BS_COMPACT.format(round2(amount))}`
}

export function formatCycleDate(ts: number): string {
  const { day, month } = parts(ts)
  return `${day}/${month}`
}

export function formatCycleDateLong(ts: number): string {
  return DATE_PARTS.format(new Date(ts))
}

export function formatCycleRange(start: number, end: number | null): string {
  const from = formatCycleDate(start)
  if (!end) return `${from} – hoy`
  return `${from} – ${formatCycleDate(end)}`
}

/**
 * `DD/MM · HH:mm` en hora de Bolivia.
 *
 * Acepta el timestamp del viaje y, por compatibilidad con documentos que todavia
 * no migraron, tambien el string viejo `"DD/MM HH:mm"` (del que saca dia, mes y
 * hora, pero no el anio).
 */
export function formatTripDate(trip: { timestamp?: number; legacyDate?: string }): string {
  if (typeof trip.timestamp === 'number') {
    const formatted = DATE_PARTS.format(new Date(trip.timestamp))
    const day = formatted.slice(0, 2)
    const month = formatted.slice(3, 5)
    const time = TIME_PARTS.format(new Date(trip.timestamp))
    return `${day}/${month} · ${time}`
  }

  if (trip.legacyDate) {
    const match = trip.legacyDate.match(/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/)
    if (match) {
      const [, dd, mm, hh, mi] = match
      return `${dd}/${mm} · ${hh}:${mi}`
    }
    return trip.legacyDate
  }

  return '—'
}

export function formatMonthShort(ts: number): string {
  const label = MONTH_FORMAT.format(new Date(ts))
  return label.replace('.', '')
}

export function formatWeekday(ts: number): string {
  return WEEKDAY_FORMAT.format(new Date(ts)).replace('.', '')
}

export function formatLiters(liters: number | null): string {
  if (liters === null || !Number.isFinite(liters)) return '—'
  return `${round2(liters)} L`
}

export function formatDaysOpen(ts: number, now: number = Date.now()): string {
  const days = Math.max(0, Math.floor((now - ts) / 86_400_000))
  if (days === 0) return 'hoy'
  if (days === 1) return '1 día abierto'
  return `${days} días abiertos`
}