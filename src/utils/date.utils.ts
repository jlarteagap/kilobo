// utils/date.utils.ts
import {
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  subMonths,
  format, isAfter, isBefore, isEqual,
  eachMonthOfInterval, subYears,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { Period, DateRange } from '@/types/period'

// ─── Ya existente — no tocar ──────────────────────────────────────────────────
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// ─── Resolver período → rango de fechas concreto ──────────────────────────────
export function resolvePeriod(period: Period): DateRange {
  const now = new Date()

  switch (period.type) {
    case 'THIS_WEEK':
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }), // lunes
        to:   endOfWeek(now,   { weekStartsOn: 1 }), // domingo
      }

    case 'THIS_MONTH':
      return {
        from: startOfMonth(now),
        to:   endOfMonth(now),
      }

    case 'LAST_MONTH': {
      const lastMonth = subMonths(now, 1)
      return {
        from: startOfMonth(lastMonth),
        to:   endOfMonth(lastMonth),
      }
    }

    case 'CUSTOM_MONTH': {
      const date = new Date(period.year, period.month, 1)
      return {
        from: startOfMonth(date),
        to:   endOfMonth(date),
      }
    }

    case 'CUSTOM_RANGE':
      return {
        from: parseLocalDate(period.from),
        to:   parseLocalDate(period.to),
      }
  }
}

// ─── Filtrar transacciones por período ────────────────────────────────────────
export function filterByPeriod<T extends { date: string }>(
  items:  T[],
  period: Period
): T[] {
  const { from, to } = resolvePeriod(period)

  return items.filter((item) => {
    const date = parseLocalDate(item.date)
    return (
      (isAfter(date, from)  || isEqual(date, from)) &&
      (isBefore(date, to)   || isEqual(date, to))
    )
  })
}

// ─── Label legible para mostrar en UI ────────────────────────────────────────
export function getPeriodLabel(period: Period): string {
  switch (period.type) {
    case 'THIS_WEEK':
      return 'Esta semana'
    case 'THIS_MONTH':
      return 'Este mes'
    case 'LAST_MONTH':
      return format(subMonths(new Date(), 1), 'MMMM yyyy', { locale: es })
    case 'CUSTOM_MONTH':
      return format(
        new Date(period.year, period.month, 1),
        'MMMM yyyy',
        { locale: es }
      )
    case 'CUSTOM_RANGE':
      return `${period.from} → ${period.to}`
  }
}

// ─── Lista de meses disponibles para el picker ────────────────────────────────
export function getAvailableMonths(): { year: number; month: number; label: string }[] {
  const now   = new Date()
  const start = subYears(now, 1)  // últimos 12 meses

  return eachMonthOfInterval({ start, end: now })
    .reverse()  // más reciente primero
    .map((date) => ({
      year:  date.getFullYear(),
      month: date.getMonth(),
      label: format(date, 'MMMM yyyy', { locale: es }),
    }))
}

// ─── Período anterior — para calcular tendencia ───────────────────────────────
export function getPreviousPeriod(period: Period): Period {
  switch (period.type) {
    case 'THIS_WEEK':
      return { type: 'CUSTOM_RANGE',
        from: format(
          startOfWeek(subMonths(new Date(), 0), { weekStartsOn: 1 }),
          'yyyy-MM-dd'
        ),
        to: format(
          endOfWeek(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 }),
          'yyyy-MM-dd'
        ),
      }

    case 'THIS_MONTH':
      return { type: 'LAST_MONTH' }

    case 'LAST_MONTH': {
      const twoMonthsAgo = subMonths(new Date(), 2)
      return {
        type:  'CUSTOM_MONTH',
        year:  twoMonthsAgo.getFullYear(),
        month: twoMonthsAgo.getMonth(),
      }
    }

    case 'CUSTOM_MONTH': {
      const prev = subMonths(new Date(period.year, period.month, 1), 1)
      return {
        type:  'CUSTOM_MONTH',
        year:  prev.getFullYear(),
        month: prev.getMonth(),
      }
    }

    case 'CUSTOM_RANGE': {
      const from    = parseLocalDate(period.from)
      const to      = parseLocalDate(period.to)
      const daysDiff = Math.ceil(
        (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
      )
      const prevTo   = new Date(from.getTime() - 24 * 60 * 60 * 1000)
      const prevFrom = new Date(prevTo.getTime() - daysDiff * 24 * 60 * 60 * 1000)
      return {
        type: 'CUSTOM_RANGE',
        from: format(prevFrom, 'yyyy-MM-dd'),
        to:   format(prevTo,   'yyyy-MM-dd'),
      }
    }
  }
}

// ─── Generar días del período para el chart ───────────────────────────────────
export function getDaysInPeriod(period: Period): string[] {
  const { from, to } = resolvePeriod(period)
  const days: string[] = []

  let current = new Date(from)
  while (current <= to) {
    days.push(format(current, 'yyyy-MM-dd'))
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
  }

  return days
}