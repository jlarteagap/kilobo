// app/(dashboard)/page.tsx
"use client"

import AppLayout from "@/components/layout/AppLayout"
import dynamic   from "next/dynamic"

import { DashboardHeader }             from "@/features/dashboard/components/DashboardHeader"
import { DashboardDebts }              from "@/features/dashboard/components/DashboardDebts"
import { DashboardBudgets }            from "@/features/dashboard/components/DashboardBudgets"
import { DashboardRecentTransactions } from "@/features/dashboard/components/DashboardRecentTransactions"
import { AssetsSection }               from "@/features/dashboard/AssetsSection"
import { IncomeExpenseChart }          from "@/features/transactions/components/analytics/IncomeExpenseChart"
import { DashboardSkeleton }           from "@/features/dashboard/components/skeletons/DashboardSkeleton"

import { useDashboard }          from "@/features/dashboard/hooks/useDashboard"
import { useTransactionMetrics } from "@/features/transactions/hooks/useTransactionMetrics"
import { useCategories }         from "@/features/categories/hooks/useCategories"

import { CashflowSectionSkeleton } from "@/features/dashboard/components/skeletons/CashflowSectionSkeleton"

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
      <div className="flex flex-col gap-4 md:gap-8 container mx-auto max-w-7xl py-4 md:py-8 px-4">

        {/* ── Header + Stats ── */}
        <DashboardHeader
          greeting={greeting}
          currentMonthLabel={currentMonthLabel}
          netWorth={netWorthRaw}
          monthlyStats={monthlyStats}
          trends={trends}
          netWorthPositive={accountsDashboard.netWorthPositive}
        />

        {/* ── Fila 1: Patrimonio (1/3) + Cashflow (2/3) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <AssetsSection groups={accountsDashboard.currencyGroups} />
          </div>
          <div className="lg:col-span-2">
            <CashflowSection />
          </div>
        </div>

        {/* ── Fila 2: Ingresos vs Gastos (2/3) + Deudas (1/3) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <IncomeExpenseChart
              key={`dashboard-chart-${metrics.chartData.length}`}
              data={metrics.chartData}
            />
          </div>
          <div className="lg:col-span-1">
            <DashboardDebts
              activeDebts={activeDebts}
              pendingGiven={debtSummary.pendingGiven}
              pendingReceived={debtSummary.pendingReceived}
            />
          </div>
        </div>

        {/* ── Fila 3: Presupuestos (1/3) + Últimas transacciones (2/3) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <DashboardBudgets topBudgets={topBudgets} />
          </div>
          <div className="lg:col-span-2">
            <DashboardRecentTransactions transactions={recentTransactions} />
          </div>
        </div>

      </div>
    </AppLayout>
  )
}