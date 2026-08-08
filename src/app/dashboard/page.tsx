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
import { useSavingsGoals }       from "@/features/savings-goals/hooks/useSavingsGoals"
import { useAccounts }           from "@/features/accounts/hooks/useAccounts"
import { CashflowSectionSkeleton } from "@/features/dashboard/components/skeletons/CashflowSectionSkeleton"
import { InsightsWidget } from "@/features/insights/components/InsightsWidget"
import { useState } from "react"
import { InvestmentsWidget } from "@/features/investments/InvestmentsList"
import { DriverWidget } from "@/features/driver/components/DriverWidget"
import { CreateInvestmentForm } from "@/features/investments/CreateInvestmentForm"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
    recentTransactions,
    activeDebts,
    debtSummary,
    topBudgets,
    currentMonthLabel,
    financialComparisonData,
    currentChartData,
    activeCredits,
    investments,
  } = useDashboard()

  const { data: savingsGoals = [] } = useSavingsGoals()
  const { data: accounts = [] } = useAccounts()
  const [showInvestDialog, setShowInvestDialog] = useState(false)

  if (isLoading) {
    return <AppLayout><DashboardSkeleton /></AppLayout>
  }

  const hasActiveSavings = savingsGoals.some((g) => g.is_active)

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 md:gap-8 container mx-auto max-w-7xl py-6 md:py-8 px-4 sm:px-6">

        {/* ── Header + Stats + Multi-currency ── */}
        <DashboardHeader
          currentMonthLabel={currentMonthLabel}
          netWorth={accountsDashboard.netWorthBOBOnly}
          monthlyStats={monthlyStats}
          trends={trends}
          netWorthPositive={accountsDashboard.netWorthBOBOnlyPositive}
          currencyBreakdown={accountsDashboard.currencyBreakdown}
          totalInvestedFormatted={accountsDashboard.totalInvestedFormatted}
        />

        {/* ── Flujo de caja (Sankey full-width) ── */}
        <CashflowSection />

        {/* ── Grid 2 col: principal + rail ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Columna principal (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
            {/* Tendencia: Activos + Comparativa */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <AssetsSection groups={accountsDashboard.currencyGroups} />
              <div className="md:col-span-2">
                <FinancialComparisonChart
                  key={`dashboard-chart-${financialComparisonData.length}`}
                  data={financialComparisonData}
                />
              </div>
            </div>

            {/* Ingresos vs Gastos (mes actual) */}
            {currentChartData.length > 0 && (
              <IncomeExpenseChart data={currentChartData} />
            )}

            {/* Transacciones recientes */}
            <DashboardRecentTransactions transactions={recentTransactions} />
          </div>

          {/* Rail derecho (1/3) */}
          <aside className="flex flex-col gap-6 md:gap-8 lg:sticky lg:top-24 lg:self-start">
            {/* 1. Proyección de saldo (card sage destacada) */}
            <BalanceProjection />

            {/* 2. Obligaciones (Credits+Debts+Budgets compactos) */}
            <div className="flex flex-col gap-4">
              {activeCredits.length > 0 && <DashboardCredits activeCredits={activeCredits} />}
              {activeDebts.length > 0 && (
                <DashboardDebts
                  activeDebts={activeDebts}
                  pendingGiven={debtSummary.pendingGiven}
                  pendingReceived={debtSummary.pendingReceived}
                />
              )}
              {topBudgets.length > 0 && <DashboardBudgets topBudgets={topBudgets} />}
            </div>

            {/* 3. Metas de ahorro */}
            {hasActiveSavings && <DashboardSavingsGoals />}

            {/* 4. Conductor (compacto) */}
            <DriverWidget />

            {/* 5. Insights (AI) */}
            <InsightsWidget />

            {/* 6. Inversiones */}
            <InvestmentsWidget
              investments={investments}
              accounts={accounts}
              onShowCreate={() => setShowInvestDialog(true)}
            />
          </aside>
        </div>
      </div>

      <Dialog open={showInvestDialog} onOpenChange={(open) => !open && setShowInvestDialog(false)}>
        <DialogContent className="sm:max-w-md rounded-[22px] border-none p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              Nueva Inversión
            </DialogTitle>
          </DialogHeader>
          {showInvestDialog && (
            <CreateInvestmentForm
              onSuccess={() => setShowInvestDialog(false)}
              onCancel={() => setShowInvestDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
