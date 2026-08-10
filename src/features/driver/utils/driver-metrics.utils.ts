import type { DriverApp, PaymentMethod, ExpenseType } from '@/types/driver'
import { DRIVER_APPS, DRIVER_APP_LABELS, PAYMENT_METHOD_LABELS, EXPENSE_TYPE_LABELS } from '@/types/driver'

// ─── Duración ──────────────────────────────────────────────────────────────────
export function formatDuration(startTime: string, endTime: string | null): string {
  if (!endTime) {
    const ms = Date.now() - new Date(startTime).getTime()
    return msToDuration(ms)
  }
  const ms = new Date(endTime).getTime() - new Date(startTime).getTime()
  return msToDuration(ms)
}

export function msToDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`
}

export function hoursToDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

// ─── Fechas ───────────────────────────────────────────────────────────────────
/**
 * Parsea "YYYY-MM-DD" como fecha LOCAL (no UTC).
 * `new Date("2026-08-04")` se interpreta como medianoche UTC y en timezones
 * negativos (ej: Bolivia UTC-4) desplaza el día hacia atrás. Este helper evita eso.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return new Date(NaN)
  return new Date(y, m - 1, d)
}

// Convierte un ISO string (de createdAt/startTime) a "YYYY-MM-DD" en hora local
export function isoToLocalDateStr(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─── Moneda ────────────────────────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-BO', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatBs(amount: number): string {
  return `Bs ${formatCurrency(amount)}`
}

// ─── Colores ───────────────────────────────────────────────────────────────────
export function getAppLabel(app: DriverApp): string {
  return DRIVER_APP_LABELS[app]
}

export function getAppColor(app: DriverApp): string {
  const colors: Record<DriverApp, string> = {
    UBER:    'text-blue-600 bg-blue-50',
    YANGO:   'text-orange-600 bg-orange-50',
    INDRIVE: 'text-emerald-600 bg-emerald-50',
  }
  return colors[app]
}

export function getAppBadgeColor(app: DriverApp): string {
  const colors: Record<DriverApp, string> = {
    UBER:    'bg-blue-500/10 text-blue-600',
    YANGO:   'bg-orange-500/10 text-orange-600',
    INDRIVE: 'bg-emerald-500/10 text-emerald-600',
  }
  return colors[app]
}
