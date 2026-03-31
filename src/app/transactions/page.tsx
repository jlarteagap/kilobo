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
      <div className="container mx-auto py-8 px-4 max-w-7xl">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
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

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Period Selector */}
            <PeriodSelector
              value={filters.period}
              onChange={(period) => {
                setPeriod(period)
                resetSecondaryFilters()  // ← limpiar filtros al cambiar período
              }}
            />

            {/* Nueva transacción */}
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
          <div className="bg-rose-50 text-rose-500 text-sm p-4 rounded-xl mb-8">
            Error al cargar los datos. Intenta nuevamente.
          </div>
        ) : (
          <>
            {/* Summary Cards — con sparkline */}
            <SummaryCards
              transactions={metricsTransactions}
              period={filters.period}
              projects={projects}
            />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          {/* Header de la tabla */}
          <div className="px-4 py-3 border-b border-gray-100 space-y-3">

            {/* Fila 1: título + stats rápidas */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">
                  Movimientos
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {filtered.length} transaccion{filtered.length !== 1 ? 'es' : ''}
                </p>
              </div>

              {/* Stats rápidas del filtrado */}
              {filtered.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
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

            {/* Fila 2: filtros */}
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

          {/* Lista */}
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