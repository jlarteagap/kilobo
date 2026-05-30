// app/(dashboard)/page.tsx
"use client"

import AppLayout from "@/components/layout/AppLayout"
import dynamic   from "next/dynamic"

import { DashboardHeader }             from "@/features/dashboard/components/DashboardHeader"
import { DashboardDebts }              from "@/features/dashboard/components/DashboardDebts"
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

import { CashflowSectionSkeleton } from "@/features/dashboard/components/skeletons/CashflowSectionSkeleton"
import { InsightsWidget } from "@/features/insights/components/InsightsWidget"

const CashflowSection = dynamic(
  () => import("@/features/dashboard/CashflowSection").then(m => m.CashflowSection),
  { ssr: false, loading: () => <CashflowSectionSkeleton /> }
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
  } = useDashboard()

  const { data: categories = [] } = useCategories()

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

        {/* ── Obligaciones y metas: Deudas + Presupuestos + Ahorro ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardDebts
            activeDebts={activeDebts}
            pendingGiven={debtSummary.pendingGiven}
            pendingReceived={debtSummary.pendingReceived}
          />
          <DashboardBudgets topBudgets={topBudgets} />
          <DashboardSavingsGoals />
        </div>

        {/* ── Proyección de saldo ── */}
        <BalanceProjection />

        <InsightsWidget />

        {/* ── Transacciones recientes ── */}
        <DashboardRecentTransactions transactions={recentTransactions} />
      </div>
    </AppLayout>
  )
}