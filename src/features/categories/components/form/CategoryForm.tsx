"use client"

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { createCategorySchema, updateCategorySchema } from '@/lib/validations/category.schema'
import { useCreateCategory, useUpdateCategory } from '../../hooks/useCategories'
import { CategoryColorPicker } from './CategoryColorPicker'
import { CategoryTagsInput } from './CategoryTagsInput'
import { DEFAULT_COLOR } from './constants'
import type { Category } from '@/types/category'

type CreateFormValues = z.infer<typeof createCategorySchema>
type UpdateFormValues = z.infer<typeof updateCategorySchema>

interface CreateModeProps {
  mode:             'create'
  preselectedType?: 'INCOME' | 'EXPENSE'
  onSuccess?:       () => void
}

interface EditModeProps {
  mode:        'edit'
  category:    Category
  lockedTags?: string[]
  onSuccess?:  () => void
}

type CategoryFormProps = CreateModeProps | EditModeProps

// ─── Formulario de creación ───────────────────────────────────────────────────
function CreateCategoryForm({ preselectedType, onSuccess }: Omit<CreateModeProps, 'mode'>) {
  const createCategory = useCreateCategory()

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name:  '',
      type:  preselectedType ?? 'EXPENSE',
      icon:  '',
      color: DEFAULT_COLOR,
      tags:  [],
    },
  })

  const selectedType  = useWatch({ control: form.control, name: 'type' })


  const onSubmit = async (data: CreateFormValues) => {
    await createCategory.mutateAsync(data)
    form.reset()
    onSuccess?.()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* Selector de tipo */}
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
          {(['EXPENSE', 'INCOME'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => form.setValue('type', t)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                selectedType === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {t === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>

        {/* Nombre */}
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
                  {...field}
                  placeholder="Ej: Alimentación, Transporte…"
                  className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* Icono */}
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Icono <span className="text-gray-400 font-normal">(emoji)</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="🍔"
                  className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* Color */}
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Color
              </FormLabel>
              <FormControl>
                <CategoryColorPicker
                  value={field.value ?? DEFAULT_COLOR}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <CategoryTagsInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={createCategory.isPending}
          className="w-full rounded-xl"
        >
          {createCategory.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creando…</>
            : 'Crear Categoría'
          }
        </Button>
      </form>
    </Form>
  )
}

// ─── Formulario de edición ────────────────────────────────────────────────────
function EditCategoryForm({ category, lockedTags = [], onSuccess }: Omit<EditModeProps, 'mode'>) {
  const updateCategory = useUpdateCategory()

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      name:  category.name,
      icon:  category.icon  ?? '',
      color: category.color ?? DEFAULT_COLOR,
      tags:  category.tags  ?? [],
    },
  })

  const onSubmit = async (data: UpdateFormValues) => {
    await updateCategory.mutateAsync({ id: category.id, data })
    onSuccess?.()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* Badge de tipo — solo lectura */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl">
          <span className="text-[13px] text-gray-500">Tipo</span>
          <Badge
            variant="secondary"
            className={cn(
              category.type === 'INCOME'
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                : 'bg-rose-100 text-rose-700 hover:bg-rose-100'
            )}
          >
            {category.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
          </Badge>
          <span className="text-[11px] text-gray-400 ml-auto">No editable</span>
        </div>

        {/* Nombre */}
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
                  {...field}
                  placeholder="Ej: Alimentación, Transporte…"
                  className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* Icono */}
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Icono <span className="text-gray-400 font-normal">(emoji)</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="🍔"
                  className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* Color */}
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Color
              </FormLabel>
              <FormControl>
                <CategoryColorPicker
                  value={field.value ?? DEFAULT_COLOR}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <CategoryTagsInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                  lockedTags={lockedTags}
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={updateCategory.isPending}
          className="w-full rounded-xl"
        >
          {updateCategory.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando…</>
            : 'Guardar cambios'
          }
        </Button>
      </form>
    </Form>
  )
}

// ─── Componente público ───────────────────────────────────────────────────────
export function CategoryForm(props: CategoryFormProps) {
  if (props.mode === 'edit') {
    return (
      <EditCategoryForm
        category={props.category}
        lockedTags={props.lockedTags}
        onSuccess={props.onSuccess}
      />
    )
  }

  return (
    <CreateCategoryForm
      preselectedType={props.preselectedType}
      onSuccess={props.onSuccess}
    />
  )
}