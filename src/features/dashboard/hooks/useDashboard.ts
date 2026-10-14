import { useMemo }            from 'react'
import { useAccounts }        from '@/features/accounts/hooks/useAccounts'
import { useDebts }           from '@/features/debts/hooks/useDebts'
import { useCredits }         from '@/features/credits/hooks/useCredits'
import { useAccountsDashboard } from '@/features/accounts/hooks/useAccountsDashboard'
import { useInvestments }     from '@/features/investments/hooks/useInvestments'
import { useDashboardMetrics } from './useDashboardMetrics'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function useDashboard() {
  const { data: accounts  = [], isLoading: loadingAccounts  } = useAccounts()
  const { data: debts     = [], isLoading: loadingDebts     } = useDebts()
  const { data: credits   = [], isLoading: loadingCredits   } = useCredits()
  const { data: investments = [], isLoading: loadingInvestments } = useInvestments()
  const { data: metricsData, isLoading: loadingMetrics } = useDashboardMetrics()

  const accountsDashboard = useAccountsDashboard(accounts, debts, investments)

  // `transactions` ya no se carga aquí: la agregación se hace en el servidor.
  // Era la lectura más cara del dashboard (historial completo en cada visita).
  const isLoading = loadingAccounts || loadingDebts || loadingCredits || loadingInvestments || loadingMetrics

  const activeCredits = useMemo(() =>
    credits.filter((c) => c.status === 'ACTIVE'),
    [credits]
  )

  const metrics = useMemo(() => {
    const d = metricsData
    if (!d) {
      return {
        currentPeriod: { type: 'THIS_MONTH' as const },
        monthlyTransactions: [],
        monthlyStats: { income: 0, expense: 0, net: 0, fixedExpense: 0, variableExpense: 0 },
        trends: { income: 0, expense: 0, net: 0 },
        financialComparisonData: [],
        currentChartData: [],
        recentTransactions: [],
        activeDebts: [],
        debtSummary: { pendingGiven: 0, pendingReceived: 0 },
        topBudgets: [],
      }
    }

    const budgetProgress = d.budgetProgress ?? []

    return {
      currentPeriod: { type: 'THIS_MONTH' as const },
      // El dashboard ya no reduce transacciones en el navegador, así que no
      // existe una lista mensual derivada. Los consumidores que la needingla deben
      // pedirla por su cuenta.
      monthlyTransactions: [],
      monthlyStats: d.monthlyStats,
      trends: d.trends,
      financialComparisonData: d.comparisonData,
      currentChartData: d.chartData,
      recentTransactions: d.recentTransactions,
      activeDebts: debts.filter((x) => x.status === 'ACTIVE'),
      debtSummary: d.debtSummary,
      topBudgets: budgetProgress
        .filter((p) => p.budget.is_active)
        .sort((a, b) => {
          const priority: Record<string, number> = { OVERDUE: 0, AT_RISK: 1, ON_TRACK: 2, COMPLETED: 3 }
          return (priority[a.status] ?? 4) - (priority[b.status] ?? 4)
        })
        .slice(0, 3),
    }
  }, [metricsData, debts])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  const currentMonthLabel = format(new Date(), 'MMMM yyyy', { locale: es })

  return {
    isLoading,
    accountsDashboard,
    activeCredits,
    investments,
    budgetProgress: metricsData?.budgetProgress ?? [],
    greeting,
    currentMonthLabel,
    ...metrics,
  }
}