"use client"

import { useState } from "react"
import { TransactionForm } from "@/features/transactions/TransactionForm"
import { TransactionList } from "@/features/transactions/TransactionList"
import { Plus } from "lucide-react"

import AppLayout from "@/components/layout/AppLayout"
import { useTransactions } from "@/features/transactions/hooks/useTransactions"
import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { useCategories } from "@/features/categories/hooks/useCategories"
import { Period, useTransactionMetrics } from "@/features/transactions/hooks/useTransactionMetrics"
import { SummaryCards } from "@/features/transactions/components/analytics/SummaryCards"
import { IncomeExpenseChart } from "@/features/transactions/components/analytics/IncomeExpenseChart"
import { CategoryOverview } from "@/features/transactions/components/analytics/CategoryOverview"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PeriodSelector } from "./components/PeriodSelector"
import { TransactionsSkeleton } from "./components/skeletons/TransactionsSkeleton"


export default function TransactionsPage() {
  const [open, setOpen] = useState(false)
  
  // Data State - using React Query Hooks
  const { data: transactions = [], isLoading: loadingTransactions, error: transactionsError } = useTransactions()
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts()
  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  
  const isLoading = loadingTransactions || loadingAccounts || loadingCategories
  const isError = transactionsError as any

  // Analytics State
  const [period, setPeriod] = useState<Period>('1M')

  const metrics = useTransactionMetrics(transactions, categories, period)

  const handleSuccess = () => {
    setOpen(false)
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
            <p className="text-gray-500">Gestiona tus ingresos y gastos</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             {/* Period Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
                <PeriodSelector value={period} onChange={setPeriod} />
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <Button
                onClick={() => setOpen(true)}
                className="flex-1 md:flex-none gap-2 bg-black hover:bg-gray-800 text-white whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Nueva Transacción
              </Button>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Registrar Transacción</DialogTitle>
                  <DialogDescription>
                    Ingresa los detalles del movimiento financiero.
                  </DialogDescription>
                </DialogHeader>
                <TransactionForm onSuccess={handleSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Analytics Section */}
        {isLoading ? (
          <TransactionsSkeleton />
        ) : isError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8">
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
                <IncomeExpenseChart data={metrics.chartData} />
              </div>
              <div>
                <CategoryOverview data={metrics.categoryData} />
              </div>
            </div>
          </>
        )}


        {/* Transaction List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          <TransactionList 
            transactions={transactions} 
            accounts={accounts} 
            categories={categories}
            loading={isLoading}
          />
        </div>
      </div>
    </AppLayout>
  )
}
