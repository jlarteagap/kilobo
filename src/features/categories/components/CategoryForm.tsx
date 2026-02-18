"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useCreateCategory } from "@/features/categories/hooks/useCategories"
import { Loader2 } from "lucide-react"

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum(['INCOME', 'EXPENSE']),
  icon: z.string().optional(),
  parent_id: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryFormProps {
  onSuccess?: () => void
  parentId?: string | null
  parentType?: 'INCOME' | 'EXPENSE'
}

export function CategoryForm({ onSuccess, parentId, parentType }: CategoryFormProps) {
  const createCategory = useCreateCategory()

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      type: parentType || 'EXPENSE',
      name: '',
      icon: '',
      parent_id: parentId || undefined
    }
  })

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      console.log(data)
      await createCategory.mutateAsync(data)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error(error)
      // Here we could add a toast notification for error
    }
  }

  const type = form.watch('type')
  const isLoading = createCategory.isPending

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      
      {/* Tipo de Categoría */}
      {!parentId && (
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          {(['EXPENSE', 'INCOME'] as const).map((t) => (
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
              {t === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>
      )}
      
      {parentId && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          Creando subcategoría de tipo: <span className="font-medium">{parentType === 'INCOME' ? 'Ingreso' : 'Gasto'}</span>
        </div>
      )}

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input
          {...form.register('name')}
          type="text"
          placeholder="Ej: Comida, Transporte, Salario"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {form.formState.errors.name && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Icono (Opcional - por ahora input de texto, idealmente un selector de iconos) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Icono (Emoji)</label>
        <input
          {...form.register('icon')}
          type="text"
          placeholder="🍔"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Categoría'}
      </button>
    </form>
  )
}
