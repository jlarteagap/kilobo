// features/budgets/BudgetForm.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

import { useCategories } from "@/features/categories/hooks/useCategories"
import { useCreateBudget, useUpdateBudget } from "./hooks/useBudgets"
import {
  createBudgetSchemaWithRefinement,
  updateBudgetSchema,
  CreateBudgetInput,
} from "@/lib/validations/budget.schema"
import { BUDGET_TYPES } from "@/types/budget"
import { CURRENCY_TYPES as ACCOUNT_CURRENCY_TYPES } from "@/types/account"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input }    from "@/components/ui/input"
import { Button }   from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Budget } from "@/types/budget"

interface BudgetFormProps {
  initialData?: Budget
  onSuccess:    () => void
}

export function BudgetForm({ initialData, onSuccess }: BudgetFormProps) {
  const { data: categories = [] } = useCategories()

  const createBudget = useCreateBudget()
  const updateBudget = useUpdateBudget()

  const isEdit    = !!initialData
  const isPending = createBudget.isPending || updateBudget.isPending

  const form = useForm<CreateBudgetInput>({
    resolver: zodResolver(
      isEdit ? updateBudgetSchema : createBudgetSchemaWithRefinement
    ) as any,
    defaultValues: {
      name:          initialData?.name          ?? '',
      type:          initialData?.type          ?? 'INCOME_SOURCE',
      target_amount: initialData?.target_amount ?? 0,
      currency:      initialData?.currency      ?? 'BOB',
      due_day:       initialData?.due_day       ?? null,
      category_ids:  initialData?.category_ids  ?? [],
      is_active:     initialData?.is_active     ?? true,
    },
  })

  const type         = form.watch('type')
  const categoryIds  = form.watch('category_ids') ?? []

  // ── Toggle categoría ────────────────────────────────────────────────────────
  const toggleCategory = (catId: string) => {
    const current = form.getValues('category_ids') ?? []
    const updated = current.includes(catId)
      ? current.filter((id) => id !== catId)
      : [...current, catId]
    form.setValue('category_ids', updated, { shouldValidate: true })
  }

  // ── Categorías relevantes según tipo ────────────────────────────────────────
  const relevantCategories = categories.filter((cat) => {
    if (type === 'INCOME_SOURCE') return cat.type === 'INCOME'
    if (type === 'FIXED_EXPENSE') return cat.type === 'EXPENSE'
    if (type === 'SAVINGS_GOAL')  return cat.type === 'INCOME'
    return true
  })

  const onSubmit = async (data: CreateBudgetInput) => {
    if (isEdit && initialData) {
      await updateBudget.mutateAsync(
        { id: initialData.id, data },
        { onSuccess: () => { form.reset(); onSuccess() } }
      )
    } else {
      await createBudget.mutateAsync(data, {
        onSuccess: () => { form.reset(); onSuccess() },
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Tipo de presupuesto ── */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Tipo
              </FormLabel>
              <FormControl>
                <div className="grid grid-cols-1 gap-2">
                  {BUDGET_TYPES.map(({ value, label, description, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        field.onChange(value)
                        // Limpiar categorías al cambiar tipo
                        form.setValue('category_ids', [])
                        // Limpiar due_day si no es FIXED_EXPENSE
                        if (value !== 'FIXED_EXPENSE') {
                          form.setValue('due_day', null)
                        }
                      }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200',
                        field.value === value
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-white'
                      )}
                    >
                      <span className="text-xl flex-shrink-0">{emoji}</span>
                      <div>
                        <p className={cn(
                          'text-[13px] font-semibold',
                          field.value === value ? 'text-white' : 'text-gray-700'
                        )}>
                          {label}
                        </p>
                        <p className={cn(
                          'text-[11px] leading-tight mt-0.5',
                          field.value === value ? 'text-gray-300' : 'text-gray-400'
                        )}>
                          {description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Nombre ── */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Nombre
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Alquiler del auto, Uber, Ahorro viaje…"
                  {...field}
                  className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Monto + Moneda ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="target_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  {type === 'INCOME_SOURCE' ? 'Meta de ingreso' : 'Monto'}
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
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Moneda
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:ring-gray-900/10">
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACCOUNT_CURRENCY_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />
        </div>

        {/* ── Día de vencimiento — solo FIXED_EXPENSE ── */}
        {type === 'FIXED_EXPENSE' && (
          <FormField
            control={form.control}
            name="due_day"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Día de vencimiento
                  <span className="text-gray-400 font-normal ml-1">
                    (día del mes)
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="Ej: 1"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? +e.target.value : null)
                    }
                    className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                  />
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />
        )}

        {/* ── Categorías vinculadas ── */}
        <FormField
          control={form.control}
          name="category_ids"
          render={() => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Categorías vinculadas
                <span className="text-gray-400 font-normal ml-1">
                  ({categoryIds.length} seleccionadas)
                </span>
              </FormLabel>

              {relevantCategories.length === 0 ? (
                <div className="py-3 px-4 bg-gray-50 rounded-xl text-[12px] text-gray-400">
                  No hay categorías de tipo{' '}
                  {type === 'INCOME_SOURCE' ? 'ingreso' : 'gasto'}.
                  Crea una en la sección de Categorías.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {relevantCategories.map((cat) => {
                    const isSelected = categoryIds.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium',
                          'border transition-all duration-150',
                          isSelected
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                        )}
                      >
                        {/* Color dot de categoría */}
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: isSelected
                              ? 'white'
                              : cat.color ?? '#9ca3af',
                          }}
                        />
                        {cat.name}
                      </button>
                    )
                  })}
                </div>
              )}
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Submit ── */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
            : isEdit ? 'Guardar cambios' : 'Crear presupuesto'
          }
        </Button>
      </form>
    </Form>
  )
}