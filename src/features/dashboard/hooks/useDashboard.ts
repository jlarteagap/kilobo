// features/dashboard/hooks/useDashboard.ts
import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

import { useAccounts }        from '@/features/accounts/hooks/useAccounts'
import { useTransactions }    from '@/features/transactions/hooks/useTransactions'
import { useDebts }           from '@/features/debts/hooks/useDebts'
import { useBudgetProgress }  from '@/features/budgets/hooks/useBudgets'
import { useAccountsDashboard } from '@/features/accounts/hooks/useAccountsDashboard'
import { filterByPeriod }     from '@/utils/date.utils'
import { formatCurrency }     from '@/features/accounts/utils/account-display.utils'

export function useDashboard() {
  const { data: accounts     = [], isLoading: loadingAccounts     } = useAccounts()
  const { data: transactions = [], isLoading: loadingTransactions } = useTransactions()
  const { data: debts        = [], isLoading: loadingDebts        } = useDebts()
  const budgetProgress                                               = useBudgetProgress()

  const accountsDashboard = useAccountsDashboard(accounts)

  const isLoading = loadingAccounts || loadingTransactions || loadingDebts

  // ── Período actual — este mes ─────────────────────────────────────────────
  const currentPeriod = useMemo(() => ({
    type: 'THIS_MONTH' as const,
  }), [])

  // ── Transacciones del mes actual ──────────────────────────────────────────
  const monthlyTransactions = useMemo(
    () => filterByPeriod(transactions, currentPeriod)
      .filter((t) => t.status === 'COMPLETED'),
    [transactions, currentPeriod]
  )

  // ── Totales del mes ───────────────────────────────────────────────────────
  const monthlyStats = useMemo(() => {
    const income  = monthlyTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = monthlyTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    return { income, expense, net: income - expense }
  }, [monthlyTransactions])

  // ── Período anterior para tendencia ──────────────────────────────────────
  const prevPeriod = useMemo(() => ({ type: 'LAST_MONTH' as const }), [])

  const prevMonthlyStats = useMemo(() => {
    const prev = filterByPeriod(transactions, prevPeriod)
      .filter((t) => t.status === 'COMPLETED')

    const income  = prev.filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = prev.filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    return { income, expense, net: income - expense }
  }, [transactions, prevPeriod])

  // ── Tendencias ─────────────────────────────────────────────────────────────
  const calcTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const trends = useMemo(() => ({
    income:  calcTrend(monthlyStats.income,  prevMonthlyStats.income),
    expense: calcTrend(monthlyStats.expense, prevMonthlyStats.expense),
    net:     calcTrend(monthlyStats.net,     prevMonthlyStats.net),
  }), [monthlyStats, prevMonthlyStats])

  // ── Últimas 5 transacciones ────────────────────────────────────────────────
  const recentTransactions = useMemo(() =>
    [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5),
    [transactions]
  )

  // ── Deudas activas ────────────────────────────────────────────────────────
  const activeDebts = useMemo(() =>
    debts.filter((d) => d.status === 'ACTIVE'),
    [debts]
  )

  const debtSummary = useMemo(() => {
    const pendingGiven    = activeDebts
      .filter((d) => d.type === 'GIVEN')
      .reduce((sum, d) => sum + (d.amount - d.paid_amount), 0)

    const pendingReceived = activeDebts
      .filter((d) => d.type === 'RECEIVED')
      .reduce((sum, d) => sum + (d.amount - d.paid_amount), 0)

    return { pendingGiven, pendingReceived }
  }, [activeDebts])

  // ── Top 3 presupuestos activos ────────────────────────────────────────────
  const topBudgets = useMemo(() =>
    budgetProgress
      .filter((p) => p.budget.is_active)
      .sort((a, b) => {
        // Primero los AT_RISK y OVERDUE
        const priority = { OVERDUE: 0, AT_RISK: 1, ON_TRACK: 2, COMPLETED: 3 }
        return priority[a.status] - priority[b.status]
      })
      .slice(0, 3),
    [budgetProgress]
  )

  // ── Saludo según hora ─────────────────────────────────────────────────────
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  const currentMonthLabel = format(new Date(), 'MMMM yyyy', { locale: es })

  return {
    isLoading,

    // Cuentas
    accountsDashboard,

    // Stats del mes
    monthlyStats,
    trends,
    currentPeriod,

    // Transacciones
    recentTransactions,
    monthlyTransactions,

    // Deudas
    activeDebts,
    debtSummary,

    // Presupuestos
    topBudgets,

    // UI
    greeting,
    currentMonthLabel,
  }
}