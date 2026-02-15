"use client"

import { useState } from "react"
import { TransactionForm } from "@/features/transactions/TransactionForm"
import { TransactionList } from "@/features/transactions/TransactionList"
import { Plus } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import AppLayout from "@/components/layout/AppLayout"

export default function TransactionsPage() {
  const [open, setOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSuccess = () => {
    setOpen(false)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
            <p className="text-gray-500">Gestiona tus ingresos y gastos</p>
          </div>

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium">
                <Plus className="w-5 h-5" />
                Nueva Transacción
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          <TransactionList key={refreshKey} />
        </div>
      </div>
    </AppLayout>
  )
}
