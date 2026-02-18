"use client"

import { useState } from "react"
import { TransactionForm } from "@/features/transactions/TransactionForm"
import { TransactionList } from "@/features/transactions/TransactionList"
import { Plus } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import AppLayout from "@/components/layout/AppLayout"
import { useTransactions } from "@/features/transactions/hooks/useTransactions"
import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { useCategories } from "@/features/categories/hooks/useCategories"
import { Period, useTransactionMetrics } from "@/features/transactions/hooks/useTransactionMetrics"
import { SummaryCards } from "@/features/transactions/components/analytics/SummaryCards"
import { IncomeExpenseChart } from "@/features/transactions/components/analytics/IncomeExpenseChart"
import { CategoryOverview } from "@/features/transactions/components/analytics/CategoryOverview"

export default function TransactionsPage() {
  const [open, setOpen] = useState(false)
  
  // Data State - using React Query Hooks
  const { data: transactions = [], isLoading: loadingTransactions, error: transactionsError } = useTransactions()
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts()
  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  
  const loading = loadingTransactions || loadingAccounts || loadingCategories
  const error = transactionsError as any

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
                {(['1W', '1M', '3M'] as Period[]).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {p}
                    </button>
                ))}
            </div>

            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <button className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium whitespace-nowrap">
                  <Plus className="w-5 h-5" />
                  Nueva Transacción
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
                  <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
                    <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                      Registrar Transacción
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-500">
                      Ingresa los detalles del movimiento financiero.
                    </Dialog.Description>
                  </div>
                  
                  <TransactionForm onSuccess={handleSuccess} />
                  
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>

        {/* Analytics Section */}
        {loading ? (
             <div className="mb-8 space-y-4">
                <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="h-80 bg-gray-100 rounded-xl animate-pulse lg:col-span-2" />
                    <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
                </div>
             </div>
        ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8">Error al cargar datos: {error?.message || 'Unknown error'}</div>
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
            loading={loading}
          />
        </div>
      </div>
    </AppLayout>
  )
}
