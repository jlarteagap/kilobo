import { useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import type { Transaction, ChartDataPoint } from '@/types/transaction'
import type { Debt } from '@/types/debt'
import type { BudgetProgress } from '@/types/budget'
import { filterByPeriod, getDaysInPeriod, parseLocalDate } from '@/utils/date.utils'
import { convertToBOB } from '@/lib/config/exchange-rates'

interface FinancialMetricsInput {
  transactions: Transaction[]
  debts: Debt[]
  budgetProgress: BudgetProgress[]
}

export function useFinancialMetrics({
  transactions,
  debts,
  budgetProgress,
}: FinancialMetricsInput) {
  const currentPeriod = useMemo(() => ({ type: 'THIS_MONTH' as const }), [])
  const prevPeriod = useMemo(() => ({ type: 'LAST_MONTH' as const }), [])

  const monthlyTransactions = useMemo(
    () => filterByPeriod(transactions, currentPeriod)
      .filter((t) => t.status === 'COMPLETED'),
    [transactions, currentPeriod]
  )

  const monthlyStats = useMemo(() => {
    const income  = monthlyTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + convertToBOB(t.amount, t.currency), 0)
    const expense = monthlyTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + convertToBOB(t.amount, t.currency), 0)
    return { income, expense, net: income - expense }
  }, [monthlyTransactions])

  const prevMonthlyStats = useMemo(() => {
    const prev = filterByPeriod(transactions, prevPeriod)
      .filter((t) => t.status === 'COMPLETED')
    const income  = prev.filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + convertToBOB(t.amount, t.currency), 0)
    const expense = prev.filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + convertToBOB(t.amount, t.currency), 0)
    return { income, expense, net: income - expense }
  }, [transactions, prevPeriod])

  const financialComparisonData = useMemo(() => {
    const currentDays = getDaysInPeriod(currentPeriod)
    const previousDays = getDaysInPeriod(prevPeriod)

    const currentData = currentDays.reduce<{ expense: number; income: number }[]>((acc, dateStr) => {
      const dayTransactions = monthlyTransactions.filter(t => t.date.startsWith(dateStr))
      const dayExpense = dayTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + convertToBOB(t.amount, t.currency), 0)
      const dayIncome = dayTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + convertToBOB(t.amount, t.currency), 0)
      const prev = acc.length > 0 ? acc[acc.length - 1] : { expense: 0, income: 0 }
      acc.push({ expense: prev.expense + dayExpense, income: prev.income + dayIncome })
      return acc
    }, [])

    const prevMonthlyTransactions = filterByPeriod(transactions, prevPeriod)
      .filter((t) => t.status === 'COMPLETED')

    const previousData = previousDays.reduce<{ expense: number; income: number }[]>((acc, dateStr) => {
      const dayTransactions = prevMonthlyTransactions.filter(t => t.date.startsWith(dateStr))
      const dayExpense = dayTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + convertToBOB(t.amount, t.currency), 0)
      const dayIncome = dayTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + convertToBOB(t.amount, t.currency), 0)
      const prev = acc.length > 0 ? acc[acc.length - 1] : { expense: 0, income: 0 }
      acc.push({ expense: prev.expense + dayExpense, income: prev.income + dayIncome })
      return acc
    }, [])

    const maxDays = Math.max(currentDays.length, previousDays.length)
    const chartData = []
    for (let i = 0; i < maxDays; i++) {
      chartData.push({
        day: i + 1,
        currentExpense: i < currentData.length ? currentData[i].expense : null,
        currentIncome: i < currentData.length ? currentData[i].income : null,
        previousExpense: i < previousData.length ? previousData[i].expense : previousData[previousData.length - 1].expense,
        previousIncome: i < previousData.length ? previousData[i].income : previousData[previousData.length - 1].income,
      })
    }
    return chartData
  }, [monthlyTransactions, transactions, currentPeriod, prevPeriod])

  // ── Chart data para IncomeExpenseChart (ingresos vs gastos por día) ──
  const currentChartData = useMemo(() => {
    const days = getDaysInPeriod(currentPeriod)
    const dayMap = new Map<string, ChartDataPoint>()

    days.forEach((dateStr) => {
      const date = parseLocalDate(dateStr)
      const label = format(date, 'd MMM', { locale: es })
      dayMap.set(dateStr, { date: dateStr, income: 0, expense: 0, label })
    })

    monthlyTransactions.forEach((t) => {
      const dateStr = format(parseLocalDate(t.date), 'yyyy-MM-dd')
      const entry = dayMap.get(dateStr)
      if (!entry) return
      const amountInBOB = convertToBOB(t.amount, t.currency)
      if (t.type === 'INCOME') {
        entry.income += amountInBOB
        entry.incomeByCurrency ??= {}
        entry.incomeByCurrency[t.currency] = (entry.incomeByCurrency[t.currency] ?? 0) + t.amount
      }
      if (t.type === 'EXPENSE') {
        entry.expense += amountInBOB
        entry.expenseByCurrency ??= {}
        entry.expenseByCurrency[t.currency] = (entry.expenseByCurrency[t.currency] ?? 0) + t.amount
      }
    })

    return Array.from(dayMap.values())
  }, [monthlyTransactions, currentPeriod])

  const trends = useMemo(() => {
    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }
    return {
      income:  calcTrend(monthlyStats.income,  prevMonthlyStats.income),
      expense: calcTrend(monthlyStats.expense, prevMonthlyStats.expense),
      net:     calcTrend(monthlyStats.net,     prevMonthlyStats.net),
    }
  }, [monthlyStats, prevMonthlyStats])

  const recentTransactions = useMemo(() =>
    [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5),
    [transactions]
  )

  const activeDebts = useMemo(() =>
    debts.filter((d) => d.status === 'ACTIVE'),
    [debts]
  )

  const debtSummary = useMemo(() => {
    const pendingGiven    = activeDebts
      .filter((d) => d.type === 'GIVEN')
      .reduce((sum, d) => sum + convertToBOB(d.amount - d.paid_amount, d.currency), 0)
    const pendingReceived = activeDebts
      .filter((d) => d.type === 'RECEIVED')
      .reduce((sum, d) => sum + convertToBOB(d.amount - d.paid_amount, d.currency), 0)
    return { pendingGiven, pendingReceived }
  }, [activeDebts])

  const topBudgets = useMemo(() =>
    budgetProgress
      .filter((p) => p.budget.is_active)
      .sort((a, b) => {
        const priority = { OVERDUE: 0, AT_RISK: 1, ON_TRACK: 2, COMPLETED: 3 }
        return priority[a.status] - priority[b.status]
      })
      .slice(0, 3),
    [budgetProgress]
  )

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  const currentMonthLabel = format(new Date(), 'MMMM yyyy', { locale: es })

  return {
    currentPeriod,
    monthlyTransactions,
    monthlyStats,
    trends,
    financialComparisonData,
    currentChartData,
    recentTransactions,
    activeDebts,
    debtSummary,
    topBudgets,
    greeting,
    currentMonthLabel,
  }
}
