// features/transactions/TransactionsPage.tsx
"use client"

import { useState, Fragment } from "react"
import { Plus } from "lucide-react"

import AppLayout from "@/components/layout/AppLayout"
import { useTransactions } from "@/features/transactions/hooks/useTransactions"
import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { useCategories } from "@/features/categories/hooks/useCategories"
import {
  Period,
  useTransactionMetrics,
  filterTransactionsByPeriod,  // ← importar la función exportada
} from "@/features/transactions/hooks/useTransactionMetrics"

import { TransactionForm } from "@/features/transactions/TransactionForm"
import { TransactionList } from "@/features/transactions/TransactionList"
import { PeriodSelector } from "./components/PeriodSelector"
import { TransactionsSkeleton } from "./components/skeletons/TransactionsSkeleton"
import { SummaryCards } from "@/features/transactions/components/analytics/SummaryCards"
import { IncomeExpenseChart } from "@/features/transactions/components/analytics/IncomeExpenseChart"
import { CategoryOverview } from "@/features/transactions/components/analytics/CategoryOverview"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Transaction } from "@/types/transaction"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { cn } from "@/lib/utils"

export default function TransactionsPage() {
  const [open, setOpen]     = useState(false)
  const [period, setPeriod] = useState<Period>('1M')

  const { data: transactions = [], isLoading: loadingTransactions, error: transactionsError } = useTransactions()
  const { data: accounts    = [], isLoading: loadingAccounts    } = useAccounts()
  const { data: categories  = [], isLoading: loadingCategories  } = useCategories()

  const isLoading = loadingTransactions || loadingAccounts || loadingCategories
  const isError   = transactionsError as any

  const metrics = useTransactionMetrics(transactions, categories, period)

  // Justo después de const metrics = useTransactionMetrics(...)
  // Filtrar la lista con la misma lógica que las métricas
  const filteredTransactions = filterTransactionsByPeriod(transactions, period)

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
              Gestiona tus ingresos y gastos
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <PeriodSelector value={period} onChange={setPeriod} />

            <Dialog open={open} onOpenChange={setOpen}>
              <Button
                onClick={() => setOpen(true)}
                className="flex-1 md:flex-none gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Nueva Transacción
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
        {/* ── Analytics ── */}
{isLoading ? (
  <TransactionsSkeleton />
) : isError ? (
  <div className="bg-red-50 text-red-500 text-sm p-4 rounded-xl mb-8">
    Error al cargar los datos. Intenta nuevamente.
  </div>
) : (
  <>
    <SummaryCards
      totalIncome={metrics.totalIncome}
      totalExpense={metrics.totalExpense}
      netIncome={metrics.netIncome}
      incomeTrend={metrics.incomeTrend}
      expenseTrend={metrics.expenseTrend}
    />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        <IncomeExpenseChart
          key={`chart-${period}-${metrics.chartData.length}`}  
          data={metrics.chartData}
        />
      </div>
      <div>
        <CategoryOverview
          key={`cat-${period}-${metrics.categoryData.length}`} 
          data={metrics.categoryData}
        />
      </div>
    </div>
  </>
)}

        {/* ── Lista ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          {/* Header de la tabla con período activo */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">
                Movimientos
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {filteredTransactions.length} transacciones
              </p>
            </div>
            {/* PeriodSelector secundario — solo para la lista */}
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>

          <TransactionList
            transactions={filteredTransactions}  // ← lista filtrada
            accounts={accounts}
            categories={categories}
            loading={isLoading}
          />
        </div>
      </div>
    </AppLayout>
  )
}