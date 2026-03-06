// features/transactions/TransactionForm.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PAYMENT_METHODS } from "@/lib/validations/transaction.schema"
import { PAYMENT_METHOD_LABELS } from '@/features/transactions/utils/transaction-display.utils'

import { useCategories } from "@/features/categories/hooks/useCategories"
import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { useCreateTransaction } from "@/features/transactions/hooks/useTransactions"

import {formatCurrency } from '@/features/accounts/utils/account-display.utils'
import {
  createTransactionSchema,
  CreateTransactionInput,
  TRANSACTION_TYPES,
} from "@/lib/validations/transaction.schema"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { TRANSACTION_TYPE_LABELS } from "./utils/transaction-display.utils"
import type { Category } from "@/types/category"
import type { Account } from "@/types/account"
// ─── Helper ───────────────────────────────────────────────────────────────────
function getTagsForCategory(categoryId: string | undefined, categories: Category[]): string[] {
  if (!categoryId) return []
  return categories.find((c) => c.id === categoryId)?.tags ?? []
}

function AccountBalanceHint({
  accountId,
  amount,
  type,
  accounts,
}: {
  accountId: string | undefined
  amount:    number
  type:      string
  accounts:  Account[]
}) {
  if (!accountId) return null

  const account     = accounts.find((a) => a.id === accountId)
  if (!account) return null

  const showBalance = type === 'EXPENSE' || type === 'DEBT'
  const isOverdraft = showBalance && amount > account.balance

  return (
    <div className={cn(
      'flex items-center justify-between px-3 py-2 rounded-xl text-[12px] transition-all duration-200',
      isOverdraft
        ? 'bg-rose-50 text-rose-500'
        : 'bg-gray-50 text-gray-400'
    )}>
      <span>Balance disponible</span>
      <span className={cn('font-semibold', isOverdraft && 'text-rose-600')}>
        {formatCurrency(account.balance, account.currency)}
        {isOverdraft ? (
          <span className="ml-1.5 font-normal">
            · insuficiente
          </span>
        ) : null}
      </span>
    </div>
  )
}
// ─── Componente ───────────────────────────────────────────────────────────────
export function TransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: categories = [] } = useCategories()
  const { data: accounts   = [] } = useAccounts()
  const createTransaction         = useCreateTransaction()

  const form = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema) as any,
    defaultValues: {
      type:         'EXPENSE',
      date:         new Date().toISOString().split('T')[0],
      is_recurring: false,
      amount:       0,
      tag:          undefined,
    },
  })

  const type       = form.watch('type')
  const categoryId = form.watch('category_id')
  const availableTags = getTagsForCategory(categoryId, categories)
  const showCategory  = type !== 'TRANSFER' && type !== 'SAVING'
  const showDestAccount = type === 'TRANSFER' || type === 'SAVING'

  const handleCategoryChange = (value: string) => {
    form.setValue('category_id', value)
    form.setValue('tag', undefined)
  }

  const handleTypeChange = (t: typeof TRANSACTION_TYPES[number]) => {
    form.setValue('type', t)
    form.setValue('category_id', undefined)
    form.setValue('tag', undefined)
  }

  const onSubmit = async (data: CreateTransactionInput) => {
    await createTransaction.mutateAsync(data, {
      onSuccess: () => {
        form.reset()
        onSuccess()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Tipo — segmented control estilo Apple ── */}
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
          {TRANSACTION_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={cn(
                'flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200',
                type === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {TRANSACTION_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* ── Fila 1: Monto + Fecha ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Monto
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                  />
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Fecha
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                  />
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />
        </div>

        {/* ── Fila 2: Cuenta origen + Categoría ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  {type === 'INCOME' ? 'Cuenta destino' : 'Cuenta origen'}
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:ring-gray-900/10">
                      <SelectValue placeholder="Seleccionar cuenta" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />

          {/* Categoría o Cuenta destino según tipo */}
          {showCategory ? (
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-gray-600">
                    Categoría
                  </FormLabel>
                  <Select
                    onValueChange={handleCategoryChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:ring-gray-900/10">
                        <SelectValue placeholder="Sin categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories
                        .filter((c) => !c.parent_id && c.type === (
                          type === 'DEBT' ? 'EXPENSE' : type
                        ))
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="to_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-gray-600">
                    Cuenta destino
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:ring-gray-900/10">
                        <SelectValue placeholder="Seleccionar cuenta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} ({acc.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* ── Tags — chips dinámicos según categoría ── */}
        {showCategory && availableTags.length > 0 ? (
          <FormField
            control={form.control}
            name="tag"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Etiqueta
                  <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => form.setValue('tag', undefined)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
                        !field.value
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      )}
                    >
                      Ninguna
                    </button>
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => form.setValue('tag', tag)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
                          field.value === tag
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />
        ) : null}

        <AccountBalanceHint
          accountId={form.watch('account_id')}
          amount={form.watch('amount') ?? 0}
          type={type}
          accounts={accounts}
        />

        {/* ── Nota ── */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Nota
                <span className="text-gray-400 font-normal ml-1">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  {...field}
                  value={field.value ?? ''}
                  className="rounded-xl border-0 bg-gray-50 resize-none focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />
<FormField
  control={form.control}
  name="payment_method"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-[13px] font-medium text-gray-600">
        Método de pago
        <span className="text-gray-400 font-normal ml-1">(opcional)</span>
      </FormLabel>
      <FormControl>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => form.setValue('payment_method', undefined)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
              !field.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            Ninguno
          </button>
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => form.setValue('payment_method', method)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
                field.value === method
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              )}
            >
              {PAYMENT_METHOD_LABELS[method]}
            </button>
          ))}
        </div>
      </FormControl>
      <FormMessage className="text-[12px]" />
    </FormItem>
  )}
/>
        {/* ── Recurrente ── */}
        {(type === 'EXPENSE' || type === 'SAVING' || type === 'DEBT') ? (
          <FormField
            control={form.control}
            name="is_recurring"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0 px-1">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal text-[13px] text-gray-600 cursor-pointer">
                  Esta transacción es recurrente
                </FormLabel>
              </FormItem>
            )}
          />
        ) : null}

        {/* ── Submit ── */}
        <Button
          type="submit"
          disabled={createTransaction.isPending}
          className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {createTransaction.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
            : 'Guardar Transacción'
          }
        </Button>
      </form>
    </Form>
  )
}