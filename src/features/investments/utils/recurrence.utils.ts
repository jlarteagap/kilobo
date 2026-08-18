// features/investments/utils/recurrence.utils.ts
import { format, addDays, nextDay } from "date-fns"
import { es } from "date-fns/locale"
import type { InvestmentRecurrence } from "@/types/investment"

/**
 * Próxima ocurrencia del día de semana (0=Dom … 6=Sáb) estrictamente posterior a `today`.
 */
export function nextOccurrenceAfter(today: Date, dayOfWeek: number): Date {
  const candidate = nextDay(today, dayOfWeek as Parameters<typeof nextDay>[1])
  // nextDay devuelve la próxima ocurrencia (si hoy coincide, la de +7 días)
  return candidate
}

/**
 * Ocurrencia del día de semana en o después de `today` (si hoy ya es ese día, devuelve hoy:
 * el plan queda pendiente ese mismo día).
 */
export function nextOccurrence(today: Date, dayOfWeek: number): Date {
  if (today.getDay() === dayOfWeek) return today
  return nextOccurrenceAfter(today, dayOfWeek)
}

/** Fecha 'yyyy-MM-dd' de la próxima ocurrencia (en o después de hoy). */
export function nextDueString(today: Date, dayOfWeek: number): string {
  return format(nextOccurrence(today, dayOfWeek), "yyyy-MM-dd")
}

/** Fecha 'yyyy-MM-dd' de la ocurrencia estrictamente posterior (para avanzar tras ejecutar). */
export function nextDueStringAfter(today: Date, dayOfWeek: number): string {
  return format(nextOccurrenceAfter(today, dayOfWeek), "yyyy-MM-dd")
}

/**
 * Un plan está "pendiente" cuando está activo y su próxima fecha ya venció (hoy >= next_due).
 * Compara strings 'yyyy-MM-dd' (orden lexicográfico = cronológico).
 */
export function isPlanDue(plan: InvestmentRecurrence, today: Date): boolean {
  if (!plan.enabled || !plan.next_due) return false
  return plan.next_due <= format(today, "yyyy-MM-dd")
}

/** Día de la semana amigable, ej. "vie". */
export function formatWeekdayShort(dayOfWeek: number): string {
  return format(addDays(new Date(2021, 0, 3), dayOfWeek), "EEE", { locale: es })
}

/** Día de la semana capitalizado y completo, ej. "Viernes". */
export function formatWeekdayLong(dayOfWeek: number): string {
  const label = format(addDays(new Date(2021, 0, 3), dayOfWeek), "EEEE", { locale: es })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Lista de días de la semana para selects (valor = date-fns getDay). */
export const WEEKDAYS = Array.from({ length: 7 }, (_, dow) => ({
  value: dow,
  label: formatWeekdayLong(dow),
}))