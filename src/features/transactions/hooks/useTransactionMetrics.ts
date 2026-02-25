// features/transactions/hooks/useTransactionMetrics.ts
import { useMemo } from 'react'
import { startOfDay, subDays, isAfter, isBefore, isEqual, format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseLocalDate } from '@/lib/utils'  // ← importar el helper
import type { Transaction } from '@/types/transaction'
import type { Category } from '@/types/category'


export type Period = '1W' | '1M' | '3M' | 'ALL'

interface DailyData {
  date:    string
  income:  number
  expense: number
  label:   string
}

// ─── Función exportada — usada también en TransactionsPage ───────────────────
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: Period
): Transaction[] {
  if (period === 'ALL') return transactions

  const now       = new Date()
  const todayStart = startOfDay(now)  // ← normalizar a medianoche local

  let startDate: Date
  switch (period) {
    case '1W': startDate = subDays(todayStart, 7);  break
    case '1M': startDate = subDays(todayStart, 30); break
    case '3M': startDate = subDays(todayStart, 90); break
  }

  return transactions.filter((t) => {
    const txDate = parseLocalDate(t.date)  // ← ya es medianoche local
    // isAfter OR isEqual — incluir el día exacto del startDate
    return isAfter(txDate, startDate!) || isEqual(txDate, startDate!)
  })
}

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useTransactionMetrics(
  transactions: Transaction[],
  categories:   Category[],
  period:       Period
) {
  const metrics = useMemo(() => {
    const now = new Date()

    const filteredTransactions = filterTransactionsByPeriod(transactions, period)
      .filter((t) => t.status === 'COMPLETED')

      
    // ── Totales ──────────────────────────────────────────────────────────────
    const totalIncome = filteredTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = filteredTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const netIncome = totalIncome - totalExpense

    // ── Tendencia vs período anterior ────────────────────────────────────────
    let previousTransactions: Transaction[] = []

if (period !== 'ALL') {
  const todayStart = startOfDay(now)
  const startDate  = period === '1W'
    ? subDays(todayStart, 7)
    : period === '1M'
      ? subDays(todayStart, 30)
      : subDays(todayStart, 90)

  const daysInPeriod = (todayStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  const previousStartDate = subDays(startDate, daysInPeriod)

  previousTransactions = transactions.filter((t) => {
    const date = parseLocalDate(t.date)
    return (
      (isAfter(date, previousStartDate) || isEqual(date, previousStartDate)) &&
      isBefore(date, startDate) &&
      t.status === 'COMPLETED'
    )
  })
}

    const prevTotalIncome  = previousTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const prevTotalExpense = previousTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const incomeTrend  = prevTotalIncome  === 0 ? 0
      : ((totalIncome  - prevTotalIncome)  / prevTotalIncome)  * 100

    const expenseTrend = prevTotalExpense === 0 ? 0
      : ((totalExpense - prevTotalExpense) / prevTotalExpense) * 100

    // ── Chart data ────────────────────────────────────────────────────────────
    const daysMap = new Map<string, DailyData>()

    if (period !== 'ALL') {
  const todayStart = startOfDay(now)
  const startDate  = period === '1W'
    ? subDays(todayStart, 7)
    : period === '1M'
      ? subDays(todayStart, 30)
      : subDays(todayStart, 90)

  let tempDate = startDate
  while (tempDate <= todayStart) {  // ← hasta hoy inclusive
    const dateStr = format(tempDate, 'yyyy-MM-dd')
    daysMap.set(dateStr, {
      date:    dateStr,
      income:  0,
      expense: 0,
      label:   format(tempDate, 'd MMM', { locale: es }),
    })
    tempDate = new Date(tempDate.getTime() + 24 * 60 * 60 * 1000)
  }
}

    filteredTransactions.forEach((t) => {
      const dateStr = format(parseLocalDate(t.date), 'yyyy-MM-dd')  // ← parseLocalDate
      const entry   = daysMap.get(dateStr)
      if (entry) {
        if (t.type === 'INCOME')  entry.income  += t.amount
        if (t.type === 'EXPENSE') entry.expense += t.amount
      }
    })

    console.log('🔍 filteredTransactions:', filteredTransactions.slice(0, 3).map(t => ({
  date:   t.date,
  type:   t.type,
  amount: t.amount,
  status: t.status,
})))
console.log('🗺 daysMap keys (primeros 5):', Array.from(daysMap.keys()).slice(0, 5))

// Justo después del forEach de filteredTransactions
console.log('📅 fechas en transacciones:', filteredTransactions.map(t => t.date))
console.log('🗺 todas las keys del daysMap:', Array.from(daysMap.keys()))


    const chartData = Array.from(daysMap.values())

    // ── Category distribution ─────────────────────────────────────────────────
    const expenseByCategory = new Map<string, number>()

    filteredTransactions
      .filter((t) => t.type === 'EXPENSE')
      .forEach((t) => {
        const category = categories.find((c) => c.id === t.category_id)
        const catName  = category?.name ?? 'Sin Categoría'
        expenseByCategory.set(catName, (expenseByCategory.get(catName) ?? 0) + t.amount)
      })

    const categoryData = Array.from(expenseByCategory.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    return {
      totalIncome,
      totalExpense,
      netIncome,
      incomeTrend,
      expenseTrend,
      chartData,
      categoryData,
    }
  }, [transactions, categories, period])
  return metrics
}