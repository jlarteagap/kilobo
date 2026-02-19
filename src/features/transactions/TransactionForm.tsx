"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { useCategories } from "@/features/categories/hooks/useCategories"
import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { useCreateTransaction } from "@/features/transactions/hooks/useTransactions"
import { createTransactionSchema, CreateTransactionInput, TRANSACTION_TYPES } from "@/lib/validations/transaction.schema"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { TRANSACTION_TYPE_LABELS } from "./utils/transaction-display.utils"



export function TransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()
  const createTransaction = useCreateTransaction()
  
  const form = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema) as any,
    defaultValues: {
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      is_recurring: false,
      amount: 0
    }
  })
  const type = form.watch("type")
  // Loading state derived from mutations
  const isLoading = createTransaction.isPending

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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

      {/* Tipo de Transacción */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        {TRANSACTION_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => form.setValue("type", t)}
            className={`
              flex-1 py-1 text-sm font-medium rounded-md transition-colors
              ${type === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
              }
            `}
          >
            {TRANSACTION_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Monto */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="col-span-2 md:col-span-1">
              <FormLabel>Monto</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fecha */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="col-span-2 md:col-span-1">
              <FormLabel>Fecha</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Cuenta Origen */}
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem className={type === "TRANSFER" || type === "SAVING" ? "col-span-1" : "col-span-2"}>
              <FormLabel>{type === "INCOME" ? "Cuenta Destino" : "Cuenta Origen"}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cuenta Destino */}
        {(type === "TRANSFER" || type === "SAVING") && (
          <FormField
            control={form.control}
            name="to_account_id"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Cuenta Destino</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Categoría */}
      {type !== "TRANSFER" && type !== "SAVING" && (
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories
                    .filter((c) => c.type === (type === "DEBT" ? "EXPENSE" : type))
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Descripción */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nota / Descripción</FormLabel>
            <FormControl>
              <Textarea rows={2} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Recurrente */}
      {(type === "EXPENSE" || type === "SAVING" || type === "DEBT") && (
        <FormField
          control={form.control}
          name="is_recurring"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">
                Esta transacción es recurrente
              </FormLabel>
            </FormItem>
          )}
        />
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? "Guardando..." : "Guardar Transacción"}
      </Button>
    </form>
  </Form>
  )
}
