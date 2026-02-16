"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Category } from "@/types/category"
import { Account } from "@/types/account"

import { transactionService } from "@/services/transactionsService"
import { categoryService } from "@/services/categoryService"
import { accountsService } from "@/services/accountsService"
import { Loader2 } from "lucide-react"

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'SAVING', 'DEBT']),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  account_id: z.string().min(1, "Selecciona una cuenta"),
  to_account_id: z.string().optional(),
  category_id: z.string().optional(),
  date: z.string(),
  description: z.string().optional(),
  payment_method: z.enum(['CASH', 'QR', 'CARD', 'TRANSFER', 'OTHER']).optional(),
  is_recurring: z.boolean().default(false),
  currency: z.string().optional(),
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
    const categories = await categoryService.getAll()
    const accounts = await accountsService.getAccounts()
    setCategories(categories)
    setAccounts(accounts)
  }

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      setLoading(true)
      
      // Obtener la moneda de la cuenta seleccionada
      const selectedAccount = accounts.find(acc => acc.id === data.account_id)
      const currency = selectedAccount?.currency || 'USD'
      
      const transactionData = {
        ...data,
        currency
      }
      
      console.log(transactionData)
      
      // Verificar el tipo de transacción y actualizar el balance de la(s) cuenta(s)
      if (data.type === 'INCOME') {
        // INCOME: Sumar al balance de la cuenta
        if (selectedAccount) {
          const newBalance = selectedAccount.balance + data.amount
          await accountsService.update(data.account_id, { balance: newBalance })
        }
      } else if (data.type === 'EXPENSE' || data.type === 'DEBT') {
        // EXPENSE/DEBT: Restar del balance de la cuenta
        if (selectedAccount) {
          const newBalance = selectedAccount.balance - data.amount
          await accountsService.update(data.account_id, { balance: newBalance })
        }
        // TRANSFER/SAVING: Restar de la cuenta origen y sumar a la cuenta destino
        if (selectedAccount && data.to_account_id) {
          const toAccount = accounts.find(acc => acc.id === data.to_account_id)
          
          // Restar de la cuenta origen
          const newSourceBalance = selectedAccount.balance - data.amount
          await accountsService.update(data.account_id, { balance: newSourceBalance })
          
          // Sumar a la cuenta destino
          if (toAccount) {
            const newDestBalance = toAccount.balance + data.amount
            await accountsService.update(data.to_account_id, { balance: newDestBalance })
          }
        }
      }
      
      // Crear la transacción
      await transactionService.create(transactionData)
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
        {(['EXPENSE', 'INCOME', 'TRANSFER', 'SAVING', 'DEBT'] as const).map((t) => (
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
            {t === 'EXPENSE' ? 'Gasto' : t === 'INCOME' ? 'Ingreso' : t === 'TRANSFER' ? 'Transfer' : t === 'SAVING' ? 'Ahorro' : 'Deuda'}
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
              .filter(c => c.type === (type === 'DEBT' ? 'EXPENSE' : type))
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
      {(type === 'EXPENSE' || type === 'SAVING' || type === 'DEBT') && (
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
