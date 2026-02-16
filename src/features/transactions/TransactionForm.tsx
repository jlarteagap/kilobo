"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { TransactionType, PaymentMethod } from "@/types/transaction"
import { Category } from "@/types/category"
import { Account } from "@/types/account"

import { categoryService } from "@/services/categoryService"
import { accountsService } from "@/services/accountsService"
import { Loader2 } from "lucide-react"

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'SAVING']),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  account_id: z.string().min(1, "Selecciona una cuenta"),
  to_account_id: z.string().optional(),
  category_id: z.string().optional(),
  date: z.string(),
  description: z.string().optional(),
  payment_method: z.enum(['CASH', 'QR', 'CARD', 'TRANSFER', 'OTHER']).optional(),
  is_recurring: z.boolean().default(false),
}).refine((data) => {
  if (data.type === 'TRANSFER' || data.type === 'SAVING') {
    return !!data.to_account_id && data.to_account_id !== data.account_id
  }
  return true
}, {
  message: "Selecciona una cuenta destino diferente a la origen",
  path: ["to_account_id"],
})

type TransactionFormValues = z.infer<typeof transactionSchema>

export function TransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any, // Cast to any to avoid complex ZodEffects typing issues with RHF
    defaultValues: {
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      is_recurring: false,
      amount: 0
    }
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // TODO: Implement local storage or API call
    const categories = await categoryService.getAll()
    const accounts = await accountsService.getAccounts()
    console.log(categories)
    console.log(accounts)
    setCategories(categories)
    setAccounts(accounts)
  }

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      setLoading(true)
      // TODO: Implement creation logic
      console.log('Transaction data:', data)
      form.reset()
      onSuccess()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const type = form.watch('type')

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      
      {/* Tipo de Transacción */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        {(['EXPENSE', 'INCOME', 'TRANSFER', 'SAVING'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => form.setValue('type', t)}
            className={`flex-1 py-1 text-sm font-medium rounded-md transition-colors ${
              type === t 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {t === 'EXPENSE' ? 'Gasto' : t === 'INCOME' ? 'Ingreso' : t === 'TRANSFER' ? 'Transfer' : 'Ahorro'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Monto */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
          <input
            {...form.register('amount')}
            type="number"
            step="0.01"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {form.formState.errors.amount && (
            <p className="text-xs text-red-500 mt-1">{form.formState.errors.amount.message}</p>
          )}
        </div>

        {/* Fecha */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            {...form.register('date')}
            type="date"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Cuenta Origen */}
        <div className={type === 'TRANSFER' ? 'col-span-1' : 'col-span-2'}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === 'INCOME' ? 'Cuenta Destino' : 'Cuenta Origen'}
          </label>
          <select
            {...form.register('account_id')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar cuenta</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id!}>{acc.name} ({acc.currency})</option>
            ))}
          </select>
          {form.formState.errors.account_id && (
            <p className="text-xs text-red-500 mt-1">{form.formState.errors.account_id.message}</p>
          )}
        </div>

        {/* Cuenta Destino (Solo Transferencias y Ahorros) */}
        {(type === 'TRANSFER' || type === 'SAVING') && (
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Destino</label>
            <select
              {...form.register('to_account_id')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar cuenta</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id!}>{acc.name} ({acc.currency})</option>
              ))}
            </select>
             {form.formState.errors.to_account_id && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.to_account_id.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Categoría (Oculto en transferencias y ahorros) */}
      {(type !== 'TRANSFER' && type !== 'SAVING') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            {...form.register('category_id')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin categoría</option>
            {categories
              .filter(c => c.type === type)
              .map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nota / Descripción</label>
        <textarea
          {...form.register('description')}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Recurrente (Solo Ahorros y Gastos) */}
      {(type === 'EXPENSE' || type === 'SAVING') && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_recurring"
            {...form.register('is_recurring')}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_recurring" className="text-sm text-gray-700">
            Esta transacción es recurrente
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Transacción'}
      </button>
    </form>
  )
}
