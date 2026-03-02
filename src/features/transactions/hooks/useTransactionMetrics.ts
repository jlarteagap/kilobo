// features/transactions/hooks/useTransactionMetrics.ts
import { useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import {
  filterByPeriod,
  getPreviousPeriod,
  getDaysInPeriod,
  parseLocalDate,
} from '@/utils/date.utils'

import type { Period }                              from '@/types/period'
import type { Transaction, CategoryData, ChartDataPoint } from '@/types/transaction'
import type { Category }                            from '@/types/category'

export interface TransactionMetrics {
  chartData:    ChartDataPoint[]
  categoryData: CategoryData[]
  totalIncome:  number
  totalExpense: number
  netBalance:   number
  prevIncome:   number
  prevExpense:  number
}

export function useTransactionMetrics(
  transactions: Transaction[],
  categories:   Category[],
  period:       Period
): TransactionMetrics {
  return useMemo(() => {
    // ── 1. Período actual ─────────────────────────────────────────────────────
    const current = filterByPeriod(transactions, period)
      .filter((t) => t.status === 'COMPLETED')

    // ── 2. Período anterior ───────────────────────────────────────────────────
    const prevPeriod = getPreviousPeriod(period)
    const previous   = filterByPeriod(transactions, prevPeriod)
      .filter((t) => t.status === 'COMPLETED')

    // ── 3. Totales actuales ───────────────────────────────────────────────────
    const totalIncome = current
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = current
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    // ── 4. Totales anteriores ─────────────────────────────────────────────────
    const prevIncome = previous
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const prevExpense = previous
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    // ── 5. Chart data — dayMap ────────────────────────────────────────────────
    const days   = getDaysInPeriod(period)
    const dayMap = new Map<string, ChartDataPoint>()

    days.forEach((dateStr) => {
      const date  = parseLocalDate(dateStr)
      const label = format(date, 'd MMM', { locale: es })
      dayMap.set(dateStr, { date: dateStr, income: 0, expense: 0, label })
    })

    // Acumular en dayMap — correcto
    current.forEach((t) => {
      const dateStr = format(parseLocalDate(t.date), 'yyyy-MM-dd')
      const entry   = dayMap.get(dateStr)
      if (!entry) return
      if (t.type === 'INCOME')  entry.income  += t.amount
      if (t.type === 'EXPENSE') entry.expense += t.amount
    })

    const chartData = Array.from(dayMap.values())

    // ── 6. Category data — solo EXPENSE ───────────────────────────────────────
    const catMap = new Map<string, { income: number; expense: number }>()

    current
      .filter((t) => t.type === 'EXPENSE' && t.category_id)
      .forEach((t) => {
        const existing = catMap.get(t.category_id!) ?? { income: 0, expense: 0 }
        existing.expense += t.amount
        catMap.set(t.category_id!, existing)
      })

    const categoryData: CategoryData[] = Array.from(catMap.entries())
      .map(([categoryId, amounts]) => {
        const cat = categories.find((c) => c.id === categoryId)
        return {
          categoryId,
          name:       cat?.name  ?? 'Sin categoría',
          color:      cat?.color ?? '#9ca3af',
          income:     0,
          expense:    amounts.expense,
          value:      amounts.expense,
          percentage: totalExpense > 0
            ? (amounts.expense / totalExpense) * 100
            : 0,
        }
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    return {
      chartData,
      categoryData,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      prevIncome,
      prevExpense,
    }
  }, [transactions, categories, period])
}