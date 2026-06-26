// features/transactions/TransactionsPage.tsx
"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import AppLayout          from "@/components/layout/AppLayout"
import { useTransactions } from "@/features/transactions/hooks/useTransactions"
import { useAccounts }     from "@/features/accounts/hooks/useAccounts"
import { useCategories }   from "@/features/categories/hooks/useCategories"
import { useProjects }     from "@/features/projects/hooks/useProjects"

import { useTransactionFilters } from "@/features/transactions/hooks/useTransactionFilters"
import { useTransactionMetrics } from "@/features/transactions/hooks/useTransactionMetrics"

import { PeriodSelector }      from "./components/PeriodSelector"
import { TransactionFilters }  from "@/features/transactions/components/TransactionFilters"
import { SummaryCards }        from "@/features/transactions/components/analytics/SummaryCards"
import dynamic                 from "next/dynamic"

const IncomeExpenseChart = dynamic(
  () => import("@/features/transactions/components/analytics/IncomeExpenseChart").then(m => m.IncomeExpenseChart),
  { ssr: false }
)
const CategoryOverview = dynamic(
  () => import("@/features/transactions/components/analytics/CategoryOverview").then(m => m.CategoryOverview),
  { ssr: false }
)

import { TransactionList }     from "@/features/transactions/TransactionList"
import { TransactionForm }     from "@/features/transactions/TransactionForm"
import { TransactionsSkeleton } from "./components/skeletons/TransactionsSkeleton"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { getPeriodLabel } from "@/utils/date.utils"
import { cn } from "@/lib/utils"

export default function TransactionsPage() {
  const [open, setOpen] = useState(false)

  const { data: transactions = [], isLoading: loadingTx,  error: txError  } = useTransactions()
  const { data: accounts     = [], isLoading: loadingAcc                  } = useAccounts()
  const { data: categories   = [], isLoading: loadingCat                  } = useCategories()
  const { data: projects     = [], isLoading: loadingProj                 } = useProjects()


  const isLoading = loadingTx || loadingAcc || loadingCat || loadingProj
  const isError   = !!txError

  // ── Filtros — hook centralizado ─────────────────────────────────────────────
  const {
    filters,
    filtered,
    activeFilterCount,
    availableTags,
    stats,
    setPeriod,
    setAccountId,
    setCategoryId,
    setProjectId,
    setTag,
    setType,
    resetFilters,
    resetSecondaryFilters,
  } = useTransactionFilters(transactions)

  // ── Métricas — sobre transacciones filtradas por período ───────────────────
  // Para analytics usamos todas las transacciones del período sin filtros secundarios
  // para no distorsionar los gráficos al filtrar por cuenta/categoría
  const metricsTransactions = filtered

  // ── Métricas para CategoryOverview e IncomeExpenseChart ───────────────────
  const metrics = useTransactionMetrics(metricsTransactions, categories, filters.period)

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto w-full space-y-6 lg:space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="w-full lg:w-auto">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Transacciones
            </h1>
            <p className="text-[13px] text-gray-400 mt-0.5">
              {getPeriodLabel(filters.period)}
              {activeFilterCount > 0 && (
                <span className="ml-2 text-gray-300">
                  · {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''} activo{activeFilterCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto overflow-hidden">
            <div className="flex-1 lg:flex-none min-w-0">
              <PeriodSelector
                value={filters.period}
                onChange={(period) => {
                  setPeriod(period)
                  resetSecondaryFilters()
                }}
              />
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <Button
                onClick={() => setOpen(true)}
                className="flex-shrink-0 gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl whitespace-nowrap shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Nueva
              </Button>
              <DialogContent className="sm:max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">
                    Registrar Transacción
                  </DialogTitle>
                </DialogHeader>
                <TransactionForm onSuccess={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── Analytics ── */}
        {isLoading ? (
          <TransactionsSkeleton />
        ) : isError ? (
          <div className="bg-rose-50 text-rose-500 text-sm p-4 rounded-xl">
            Error al cargar los datos. Intenta nuevamente.
          </div>
        ) : (
          <>
            <SummaryCards
              transactions={transactions}
              period={filters.period}
              projects={projects}
              totalIncome={metrics.totalIncome}
              totalExpense={metrics.totalExpense}
              netBalance={metrics.netBalance}
              prevIncome={metrics.prevIncome}
              prevExpense={metrics.prevExpense}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <IncomeExpenseChart
                  key={`chart-${filters.period.type}`}
                  data={metrics.chartData}
                />
              </div>
              <div>
                <CategoryOverview
                  key={`cat-${filters.period.type}-${filters.projectId}`}
                  data={metrics.categoryData}
                  transactions={metricsTransactions}
                  projects={projects}
                  projectId={filters.projectId}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Lista de transacciones ── */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-card">
          <div className="px-4 md:px-6 py-4 border-b border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">
                  Movimientos
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {filtered.length} transaccion{filtered.length !== 1 ? 'es' : ''}
                </p>
              </div>

              {filtered.length > 0 && (
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 w-full sm:w-auto">
                  <div className="text-right sm:text-left md:text-right">
                    <p className="text-[11px] text-gray-400">Ingresos</p>
                    <p className="text-[13px] font-semibold text-emerald-600">
                      {formatCurrency(stats.income, 'BOB')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-400">Gastos</p>
                    <p className="text-[13px] font-semibold text-rose-500">
                      {formatCurrency(stats.expense, 'BOB')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-400">Neto</p>
                    <p className={cn(
                      'text-[13px] font-semibold',
                      stats.net >= 0 ? 'text-gray-900' : 'text-rose-500'
                    )}>
                      {formatCurrency(stats.net, 'BOB')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <TransactionFilters
              filters={filters}
              accounts={accounts}
              categories={categories}
              projects={projects}
              availableTags={availableTags}
              activeFilterCount={activeFilterCount}
              onAccountChange={setAccountId}
              onCategoryChange={setCategoryId}
              onProjectChange={setProjectId}
              onTagChange={setTag}
              onTypeChange={setType}
              onReset={resetFilters}
            />
          </div>

          <TransactionList
            transactions={filtered}
            accounts={accounts}
            categories={categories}
            projects={projects}
            loading={isLoading}
          />
        </div>
      </div>
    </AppLayout>
  )
}