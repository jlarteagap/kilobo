"use client"

import { useForm, useWatch, type SubmitHandler } from "react-hook-form"
import { createZodResolver } from "@/lib/validations/rhf-resolver"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { SubmitButton } from "@/components/ui/submit-button"
import { ChipSelector } from "@/components/ui/chip-selector"

import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input }     from "@/components/ui/input"
import { Textarea }  from "@/components/ui/textarea"
import { Checkbox }  from "@/components/ui/checkbox"
import { Badge }     from "@/components/ui/badge"
import {
  Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

import { useProjects } from "@/features/projects/hooks/useProjects"
import { EditableTransactionFields } from "@/features/transactions/hooks/useTransactions"
import { useUpdateTransaction }      from "@/features/transactions/hooks/useTransactions"
import type { Transaction } from "@/types/transaction"
import type { Category }    from "@/types/category"
import { getTagsForCategory, getSubtypesForProject } from "./utils/transaction-form.utils"
import { TRANSACTION_TYPE_LABELS } from "./utils/transaction-display.utils"

// ─── Schema ────────────────────────────────────────────────────────────────────
const editTransactionSchema = z.object({
  category_id:  z.string().optional(),
  tag:          z.string().optional(),
  subtype:      z.string().nullable().optional(),
  project_id:   z.string().nullable().optional(),
  description:  z.string().optional(),
  date:         z.string().min(1, 'Selecciona una fecha'),
  is_recurring: z.boolean().optional(),
})

type EditFormValues = z.infer<typeof editTransactionSchema>

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
  const updateTransaction      = useUpdateTransaction()
  const { data: projects = [] } = useProjects()          // ← NUEVO

  const form = useForm<EditFormValues>({
    resolver: createZodResolver(editTransactionSchema),
    defaultValues: {
      category_id:  transaction.category_id ?? undefined,
      tag:          transaction.tag         ?? undefined,
      subtype:      transaction.subtype     ?? undefined, // ← NUEVO
      project_id:   transaction.project_id  ?? null,     // ← NUEVO
      description:  transaction.description ?? '',
      date:         transaction.date,
      is_recurring: transaction.is_recurring,
    },
  })

  const categoryId      = useWatch({ control: form.control, name: 'category_id' })
  const projectId       = useWatch({ control: form.control, name: 'project_id' })        // ← NUEVO
  const availableTags   = getTagsForCategory(categoryId, categories)
  const availableSubtypes = getSubtypesForProject(projectId, projects)  // ← NUEVO
  const hasProject   = !!projectId && projectId !== 'none'
  const showCategory = transaction.type !== 'TRANSFER' && transaction.type !== 'SAVING' && !hasProject
  const showTags     = showCategory && availableTags.length > 0

  const handleCategoryChange = (value: string) => {
    form.setValue('category_id', value)
    form.setValue('tag', undefined)
  }

  // ← NUEVO
  const handleProjectChange = (value: string) => {
    form.setValue('project_id', value === 'none' ? null : value)
    form.setValue('subtype', undefined)
  }

  const onSubmit: SubmitHandler<EditFormValues> = async (data) => {
    await onSave(data as EditableTransactionFields)
    onSuccess()
  }

  const typeColors = {
    INCOME:   'bg-emerald-100 text-emerald-700',
    EXPENSE:  'bg-rose-100    text-rose-700',
    TRANSFER: 'bg-blue-100    text-blue-700',
    SAVING:   'bg-violet-100  text-violet-700',
  } as const

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* ── Resumen ── */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
          <Badge
            variant="secondary"
            className={cn('text-[11px] rounded-full px-3 py-1', typeColors[transaction.type])}
          >
            {TRANSACTION_TYPE_LABELS[transaction.type]}
          </Badge>
          <div className="ml-auto text-right">
            <p className="text-lg font-semibold tabular-nums text-gray-900">
              {transaction.amount} {transaction.currency}
            </p>
            {transaction.description && (
              <p className="text-[12px] text-gray-400 mt-0.5 truncate max-w-[180px]">
                {transaction.description}
              </p>
            )}
          </div>
        </div>

        {/* ── Fecha y Actividad ── */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">
              Fecha y Actividad
            </span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField<EditFormValues>
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-gray-600">Fecha</FormLabel>
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

            <FormField<EditFormValues>
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-gray-600">
                    Actividad
                    <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                  </FormLabel>
                  <Select
                    onValueChange={handleProjectChange}
                    value={(field.value as string) ?? 'none'}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:ring-gray-900/10">
                        <SelectValue placeholder="Sin actividad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-gray-400">Sin actividad</span>
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
          </div>

          {projectId && availableSubtypes.length > 0 ? (
            <FormField<EditFormValues>
              control={form.control}
              name="subtype"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-gray-600">
                    Etiqueta
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
        </div>

        {/* ── Clasificación ── */}
        {showCategory || showTags ? (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">
                Clasificación
              </span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            <div className={cn(showCategory && showTags ? 'grid grid-cols-2 gap-4' : 'space-y-4')}>
              {showCategory ? (
                <FormField<EditFormValues>
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium text-gray-600">Categoría</FormLabel>
                      <Select onValueChange={handleCategoryChange} defaultValue={field.value as string}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:ring-gray-900/10">
                            <SelectValue placeholder="Sin categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories
                            .filter((c) => !c.parent_id && c.type === transaction.type)
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

              {showTags ? (
                <FormField<EditFormValues>
                  control={form.control}
                  name="tag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium text-gray-600">
                        Etiqueta
                        <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <ChipSelector items={availableTags} value={field.value as string | null | undefined} onChange={(v) => form.setValue('tag', v ?? undefined)} clearLabel="Ninguna" />
                      </FormControl>
                      <FormMessage className="text-[12px]" />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {/* ── Detalles ── */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">
              Detalles
            </span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <FormField<EditFormValues>
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

          {(transaction.type === 'EXPENSE' || transaction.type === 'SAVING') ? (
            <FormField<EditFormValues>
              control={form.control}
              name="is_recurring"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
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
        </div>

        <div className="pt-2">
          <SubmitButton isPending={updateTransaction.isPending}>
            Guardar cambios
          </SubmitButton>
        </div>
      </form>
    </Form>
  )
}