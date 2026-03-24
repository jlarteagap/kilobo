// features/transactions/TransactionEditForm.tsx
"use client"

import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"


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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { EditableTransactionFields } from "@/features/transactions/hooks/useTransactions"
import { useUpdateTransaction } from "@/features/transactions/hooks/useTransactions"
import type { Transaction } from "@/types/transaction"
import type { Category } from "@/types/category"

// ─── Schema — solo campos editables ──────────────────────────────────────────
const editTransactionSchema = z.object({
  category_id:    z.string().optional(),
  tag:            z.string().optional(),
  description:    z.string().optional(),
  date:           z.string().min(1, 'Selecciona una fecha'),
  is_recurring:   z.boolean().optional(),
})

type EditFormValues = z.infer<typeof editTransactionSchema>

function getTagsForCategory(categoryId: string | undefined, categories: Category[]): string[] {
  if (!categoryId) return []
  return categories.find((c) => c.id === categoryId)?.tags ?? []
}
// ─── Componente ───────────────────────────────────────────────────────────────
export function TransactionEditForm({
  transaction,
  categories,
  onSuccess,
  onSave,
}: {
  transaction: Transaction
  categories:  Category[]
  onSuccess:   () => void
  onSave:      (data: EditableTransactionFields) => Promise<void>
}) {
  const updateTransaction = useUpdateTransaction()

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      category_id:    transaction.category_id ?? undefined,
      tag:            transaction.tag         ?? undefined,
      description:    transaction.description ?? '',
      date:           transaction.date,
      is_recurring:   transaction.is_recurring,
    },
  })

  const categoryId    = form.watch('category_id')
  const availableTags = getTagsForCategory(categoryId, categories)
  const categoryData  = categories.find((c) => c.id === transaction.category_id)
  const showCategory  = transaction.type !== 'TRANSFER' && transaction.type !== 'SAVING'

  const handleCategoryChange = (value: string) => {
    form.setValue('category_id', value)
    form.setValue('tag', undefined)
  }

  const onSubmit: SubmitHandler<EditFormValues> = async (data) => {
    // Usamos onSave si existe (se pasa desde la lista para manejar el cierre)
    // O directamente mutateAsync si queremos manejarlo aquí.
    // Viendo TransactionList.tsx, se espera que onSave sea handleEditSave.
    await onSave(data as EditableTransactionFields)
    onSuccess()
  }

  return (
    <Form {...(form as any)}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-5">

        {/* ── Info de solo lectura — tipo + monto ── */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-gray-500">Tipo</span>
            <Badge
              variant="secondary"
              className={cn(
                'text-[11px] rounded-full',
                transaction.type === 'INCOME'   && 'bg-emerald-100 text-emerald-700',
                transaction.type === 'EXPENSE'  && 'bg-rose-100    text-rose-700',
                transaction.type === 'TRANSFER' && 'bg-blue-100    text-blue-700',
                transaction.type === 'SAVING'   && 'bg-violet-100  text-violet-700',
                transaction.type === 'DEBT'     && 'bg-orange-100  text-orange-700',
              )}
            >
              {transaction.type}
            </Badge>
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {transaction.amount} {transaction.currency}
          </span>
          <span className="text-[11px] text-gray-400">Monto no editable</span>
        </div>

        {/* ── Fecha ── */}
        <FormField<EditFormValues>
          control={form.control as any}
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
                  value={field.value as string}
                  className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Categoría ── */}
        {showCategory ? (
          <FormField<EditFormValues>
            control={form.control as any}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Categoría
                </FormLabel>
                <Select
                  onValueChange={handleCategoryChange}
                  defaultValue={field.value as string}
                >
                  <FormControl>
                     <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:ring-gray-900/10">
                      <SelectValue placeholder="Sin categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories
                      .filter((c) => !c.parent_id && c.type === (
                        transaction.type === 'DEBT' ? 'EXPENSE' : transaction.type
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
        ) : null}

        {/* ── Tags ── */}
        {showCategory && availableTags.length > 0 ? (
          <FormField<EditFormValues>
            control={form.control as any}
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

        {/* ── Nota ── */}
        <FormField<EditFormValues>
          control={form.control as any}
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
                  value={(field.value as string) ?? ''}
                  className="rounded-xl border-0 bg-gray-50 resize-none focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />
        {/* ── Recurrente ── */}
        {(transaction.type === 'EXPENSE' || transaction.type === 'SAVING' || transaction.type === 'DEBT') ? (
          <FormField<EditFormValues>
            control={form.control as any}
            name="is_recurring"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0 px-1">
                <FormControl>
                  <Checkbox
                    checked={field.value as boolean}
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
          disabled={updateTransaction.isPending}
          className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {updateTransaction.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
            : 'Guardar cambios'
          }
        </Button>
      </form>
    </Form>
  )
}