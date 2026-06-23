// app/(dashboard)/page.tsx
"use client"

import AppLayout from "@/components/layout/AppLayout"
import dynamic   from "next/dynamic"

import { DashboardHeader }             from "@/features/dashboard/components/DashboardHeader"
import { DashboardDebts }              from "@/features/dashboard/components/DashboardDebts"
import { DashboardCredits }            from "@/features/dashboard/components/DashboardCredits"
import { DashboardBudgets }            from "@/features/dashboard/components/DashboardBudgets"
import { DashboardRecentTransactions } from "@/features/dashboard/components/DashboardRecentTransactions"
import { DashboardSavingsGoals }       from "@/features/dashboard/components/DashboardSavingsGoals"
import { AssetsSection }               from "@/features/dashboard/AssetsSection"
import { FinancialComparisonChart }    from "@/features/dashboard/components/FinancialComparisonChart"
import { BalanceProjection }           from "@/features/dashboard/components/BalanceProjection"
import { DashboardSkeleton }           from "@/features/dashboard/components/skeletons/DashboardSkeleton"

import { useDashboard }          from "@/features/dashboard/hooks/useDashboard"
import { useTransactionMetrics } from "@/features/transactions/hooks/useTransactionMetrics"
import { useCategories }         from "@/features/categories/hooks/useCategories"
import { useSavingsGoals }       from "@/features/savings-goals/hooks/useSavingsGoals"

import { CashflowSectionSkeleton } from "@/features/dashboard/components/skeletons/CashflowSectionSkeleton"
import { InsightsWidget } from "@/features/insights/components/InsightsWidget"

const CashflowSection = dynamic(
  () => import("@/features/dashboard/CashflowSection").then(m => m.CashflowSection),
  { ssr: false, loading: () => <CashflowSectionSkeleton /> }
)

const IncomeExpenseChart = dynamic(
  () => import("@/features/transactions/components/analytics/IncomeExpenseChart").then(m => m.IncomeExpenseChart),
  { ssr: false }
)

export default function DashboardPage() {
  const {
    isLoading,
    accountsDashboard,
    monthlyStats,
    trends,
    currentPeriod,
    recentTransactions,
    monthlyTransactions,
    activeDebts,
    debtSummary,
    topBudgets,
    greeting,
    currentMonthLabel,
    financialComparisonData,
    currentChartData,
    activeCredits,
  } = useDashboard()

  const { data: categories     = [] } = useCategories()
  const { data: savingsGoals   = [] } = useSavingsGoals()
  const hasActiveSavings = savingsGoals.some((g) => g.is_active)

  const metrics = useTransactionMetrics(
    monthlyTransactions,
    categories,
    currentPeriod
  )

  if (isLoading) {
    return <AppLayout><DashboardSkeleton /></AppLayout>
  }

  const netWorthRaw = accountsDashboard.netWorthRaw

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 md:gap-8 container mx-auto max-w-7xl py-6 md:py-8 px-4 sm:px-6">

        {/* ── Header + Stats ── */}
        <DashboardHeader
          greeting={greeting}
          currentMonthLabel={currentMonthLabel}
          netWorth={netWorthRaw}
          monthlyStats={monthlyStats}
          trends={trends}
          netWorthPositive={accountsDashboard.netWorthPositive}
        />


        {/* ── Flujo de caja ── */}
        <CashflowSection />

        {/* ── Tendencia: Activos + Comparativa ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AssetsSection groups={accountsDashboard.currencyGroups} />
          <div className="md:col-span-2">
            <FinancialComparisonChart
              key={`dashboard-chart-${financialComparisonData.length}`}
              data={financialComparisonData}
            />
          </div>
        </div>

        {/* ── Ingresos vs Gastos (mes actual) ── */}
        {currentChartData.length > 0 && (
          <IncomeExpenseChart data={currentChartData} />
        )}

        {/* ── Obligaciones y metas ── */}
        {[activeCredits.length > 0, activeDebts.length > 0, topBudgets.length > 0, hasActiveSavings].some(Boolean) && (
          <div className="flex flex-wrap gap-6">
            {activeCredits.length > 0 && (
              <div className="flex-1 min-w-[280px]">
                <DashboardCredits activeCredits={activeCredits} />
              </div>
            )}
            {activeDebts.length > 0 && (
              <div className="flex-1 min-w-[280px]">
                <DashboardDebts
                  activeDebts={activeDebts}
                  pendingGiven={debtSummary.pendingGiven}
                  pendingReceived={debtSummary.pendingReceived}
                />
              </div>
            )}
            {topBudgets.length > 0 && (
              <div className="flex-1 min-w-[280px]">
                <DashboardBudgets topBudgets={topBudgets} />
              </div>
            )}
            {hasActiveSavings && (
              <div className="flex-1 min-w-[280px]">
                <DashboardSavingsGoals />
              </div>
            )}
          </div>
        )}

        {/* ── Proyección de saldo ── */}
        <BalanceProjection />

        <InsightsWidget />

        {/* ── Transacciones recientes ── */}
        <DashboardRecentTransactions transactions={recentTransactions} />
      </div>
    </AppLayout>
  )
}