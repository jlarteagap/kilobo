"use client"

import { useForm, useWatch, type SubmitHandler, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input }     from "@/components/ui/input"
import { Textarea }  from "@/components/ui/textarea"
import { Checkbox }  from "@/components/ui/checkbox"
import { Button }    from "@/components/ui/button"
import { Badge }     from "@/components/ui/badge"
import {
  Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

import { useProjects } from "@/features/projects/hooks/useProjects"  // ← NUEVO
import { EditableTransactionFields } from "@/features/transactions/hooks/useTransactions"
import { useUpdateTransaction }      from "@/features/transactions/hooks/useTransactions"
import type { Transaction } from "@/types/transaction"
import type { Category }    from "@/types/category"
import type { Project }     from "@/types/project"                   // ← NUEVO

// ─── Schema — agregar project_id y subtype ────────────────────────────────────
const editTransactionSchema = z.object({
  category_id:  z.string().optional(),
  tag:          z.string().optional(),
  subtype:      z.string().nullable().optional(),   // ← NUEVO
  project_id:   z.string().nullable().optional(),   // ← NUEVO
  description:  z.string().optional(),
  date:         z.string().min(1, 'Selecciona una fecha'),
  is_recurring: z.boolean().optional(),
})

type EditFormValues = z.infer<typeof editTransactionSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTagsForCategory(categoryId: string | undefined, categories: Category[]): string[] {
  if (!categoryId) return []
  return categories.find((c) => c.id === categoryId)?.tags ?? []
}

// ← NUEVO
function getSubtypesForProject(projectId: string | null | undefined, projects: Project[]): string[] {
  if (!projectId) return []
  return projects.find((p) => p.id === projectId)?.subtypes ?? []
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
  const updateTransaction      = useUpdateTransaction()
  const { data: projects = [] } = useProjects()          // ← NUEVO

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editTransactionSchema) as unknown as Resolver<EditFormValues>,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Info de solo lectura ── */}
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

        {/* ── Proyecto ── */}       {/* ← NUEVO BLOQUE */}
        <FormField<EditFormValues>
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
                value={(field.value as string) ?? 'none'}
              >
                <FormControl>
                  <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:ring-gray-900/10">
                    <SelectValue placeholder="Sin proyecto" />
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

        {/* ── Subtype — chips según proyecto ── */}    {/* ← NUEVO BLOQUE */}
        {projectId && availableSubtypes.length > 0 ? (
          <FormField<EditFormValues>
            control={form.control}
            name="subtype"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Subtipo
                  <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => form.setValue('subtype', undefined)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
                        !field.value
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      )}
                    >
                      Ninguno
                    </button>
                    {availableSubtypes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => form.setValue('subtype', s)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
                          field.value === s
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />
        ) : null}

        {/* ── Categoría ── */}
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

        {/* ── Tags ── */}
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
        {(transaction.type === 'EXPENSE' || transaction.type === 'SAVING') ? (
          <FormField<EditFormValues>
            control={form.control}
            name="is_recurring"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0 px-1">
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