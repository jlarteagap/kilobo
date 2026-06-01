// features/transactions/TransactionForm.tsx
"use client"

import { useForm, useWatch } from "react-hook-form"
import { createZodResolver } from "@/lib/validations/rhf-resolver"
import { cn } from "@/lib/utils"
import { SubmitButton } from "@/components/ui/submit-button"
import { AccountBalanceHint } from "@/components/ui/account-balance-hint"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { ChipSelector } from "@/components/ui/chip-selector"

import { useCategories } from "@/features/categories/hooks/useCategories"
import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { useCreateTransaction } from "@/features/transactions/hooks/useTransactions"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProjects } from '@/features/projects/hooks/useProjects'

import { getLocalDateString } from "@/utils/date.utils"
import { TRANSACTION_TYPE_LABELS } from "./utils/transaction-display.utils"
import { getTagsForCategory, getSubtypesForProject } from "./utils/transaction-form.utils"
// ─── Componente ───────────────────────────────────────────────────────────────
export function TransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: categories = [] } = useCategories()
  const { data: accounts   = [] } = useAccounts()
  const { data: projects = [] } = useProjects()
  const createTransaction         = useCreateTransaction()

  const form = useForm<CreateTransactionInput>({
    resolver: createZodResolver(createTransactionSchema),
    defaultValues: {
      type:         'EXPENSE',
      date:         getLocalDateString(),
      is_recurring: false,
      amount:       0,
      account_id:   '',
      category_id:  null,
      to_account_id: undefined,
      description:  '',
      project_id:   null,
      tag:          null,
      subtype:      null,
    },
  })

  const type       = useWatch({ control: form.control, name: 'type' })
  const categoryId = useWatch({ control: form.control, name: 'category_id' })
  const projectId  = useWatch({ control: form.control, name: 'project_id' })
  const accountId  = useWatch({ control: form.control, name: 'account_id' })
  const amount     = useWatch({ control: form.control, name: 'amount' }) ?? 0
  const availableSubtypes = getSubtypesForProject(projectId, projects)

  const availableTags = getTagsForCategory(categoryId, categories)
  const hasProject      = !!projectId && projectId !== 'none'
  const showCategory    = type !== 'TRANSFER' && type !== 'SAVING' && !hasProject
  const showDestAccount = type === 'TRANSFER' || type === 'SAVING'
  const showTags        = showCategory && availableTags.length > 0
  const showSecondSlot  = showDestAccount || showCategory

  const handleCategoryChange = (value: string) => {
    form.setValue('category_id', value)
    form.setValue('tag', null)        // ← undefined → null
  }

  const handleProjectChange = (value: string) => {
    form.setValue('project_id', value === 'none' ? null : value)
    form.setValue('subtype', null)    // ← undefined → null
  }

  const handleTypeChange = (t: typeof TRANSACTION_TYPES[number]) => {
    form.setValue('type', t)
    form.setValue('category_id', null)  // ← undefined → null
    form.setValue('tag', null)          // ← undefined → null
  }

  // TransactionForm.tsx — en onSubmit
const onSubmit = async (data: CreateTransactionInput) => {
  await createTransaction.mutateAsync(data, {
    onSuccess: () => {
      form.reset({
        type:         'EXPENSE',
        date:         getLocalDateString(),
        is_recurring: false,
        amount:       0,
        tag:          null,
        project_id:   null,
        subtype:      null,
        category_id:  null,
        account_id:   '',
        to_account_id:undefined,
        description:  '',
      })
      onSuccess()
    },
  })
}

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        <SegmentedControl
          value={type}
          onChange={handleTypeChange}
          options={TRANSACTION_TYPES.map((t) => ({ value: t, label: TRANSACTION_TYPE_LABELS[t] }))}
          fullWidth
        />

        {/* ── Fila 1: Monto + Fecha ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField<CreateTransactionInput>
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
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : +e.target.value)}
                    value={typeof field.value === 'number' || typeof field.value === 'string' ? field.value : ''}
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
                    value={typeof field.value === 'string' || typeof field.value === 'number' ? field.value : ''}
                    className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                  />
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />
        </div>
{/* ── Proyecto ── */}
<FormField
  control={form.control}
  name="project_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-[13px] font-medium text-gray-600">
        Proyecto
        <span className="text-gray-400 font-normal ml-1">(opcional)</span>
      </FormLabel>
      <Select
        onValueChange={handleProjectChange}
        value={field.value ?? 'none'}
      >
        <FormControl>
          <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:ring-gray-900/10">
            <SelectValue placeholder="Gasto personal" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-gray-400">Sin proyecto</span>
          </SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex items-center gap-2">
                {p.icon && <span>{p.icon}</span>}
                {p.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage className="text-[12px]" />
    </FormItem>
  )}
/>

{projectId && availableSubtypes.length > 0 ? (
  <FormField
    control={form.control}
    name="subtype"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-[13px] font-medium text-gray-600">
          Subtipo
          <span className="text-gray-400 font-normal ml-1">(opcional)</span>
        </FormLabel>
        <FormControl>
          <ChipSelector items={availableSubtypes} value={field.value as string | null | undefined} onChange={(v) => form.setValue('subtype', v ?? undefined)} clearLabel="Ninguno" />
        </FormControl>
        <FormMessage className="text-[12px]" />
      </FormItem>
    )}
  />
) : null}
        {/* ── Fila 2: Cuenta origen + Categoría ── */}
        <div className={cn(
          "grid gap-4",
          showSecondSlot ? "grid-cols-2" : "grid-cols-1"   // ← una columna si es proyecto
        )}>
          {/* Cuenta origen — siempre visible */}
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                {type === 'INCOME' ? 'Cuenta destino' : 'Cuenta origen'}
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
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
           {/* Segundo slot — categoría o cuenta destino, nunca los dos */}
  {showDestAccount && (
    <FormField
      control={form.control}
      name="to_account_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[13px] font-medium text-gray-600">
            Cuenta destino
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ''}>
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

          {showCategory && (
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
            value={field.value ?? ''}      // ← nunca undefined
          >
            <FormControl>
              <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:ring-gray-900/10">
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {categories
                .filter((c) => !c.parent_id && c.type === type)
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
  )}
        </div>

        {showTags ? (
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
                  <ChipSelector items={availableTags} value={field.value as string | null | undefined} onChange={(v) => form.setValue('tag', v)} clearLabel="Ninguna" />
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />
        ) : null}

        {type === 'EXPENSE' && (
          <AccountBalanceHint
            accountId={accountId}
            amount={amount}
            accounts={accounts}
            showBalance
          />
        )}

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
                  value={typeof field.value === 'string' || typeof field.value === 'number' ? field.value : ''}
                  className="rounded-xl border-0 bg-gray-50 resize-none focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />
        {/* ── Recurrente ── */}
        {(type === 'EXPENSE' || type === 'SAVING') ? (
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

        <SubmitButton isPending={createTransaction.isPending}>
          Guardar Transacción
        </SubmitButton>
      </form>
    </Form>
  )
}