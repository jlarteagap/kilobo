import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/http'
import type { SankeyData, PeriodStats } from '@/lib/metrics/dashboard-metrics'
import type { BudgetProgress } from '@/types/budget'
import type { RecentTransaction } from '@/types/transaction'

export interface DashboardMetricsData {
  monthlyStats: PeriodStats & { fixedExpense: number; variableExpense: number }
  prevMonthlyStats: PeriodStats
  trends: { income: number; expense: number; net: number }
  comparisonData: {
    day: number
    currentExpense: number | null
    currentIncome: number | null
    previousExpense: number | null
    previousIncome: number | null
  }[]
  chartData: { date: string; income: number; expense: number; label: string; incomeByCurrency?: Record<string, number>; expenseByCurrency?: Record<string, number> }[]
  sankey: SankeyData
  budgetProgress: BudgetProgress[]
  debtSummary: { pendingGiven: number; pendingReceived: number }
  recentTransactions: RecentTransaction[]
}

export const dashboardKeys = {
  metrics: () => ['dashboard', 'metrics'] as const,
}

/**
 * Métricas del dashboard ya agregadas por el servidor.
 *
 * Este hook reemplaza a los que reducían en el navegador: la razón no es la
 * latencia, sino que antes cada carga del dashboard descargaba el historial
 * COMPLETO de transacciones y lo recorría en cada render.
 */
export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: async (): Promise<DashboardMetricsData> => {
      const res = await apiFetch('/api/dashboard/metrics')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener las métricas')
      return json.data as DashboardMetricsData
    },
    staleTime: 1000 * 60 * 5,
  })
}