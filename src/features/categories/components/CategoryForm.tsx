"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { categoryService } from "@/services/categoryService"
import { Loader2 } from "lucide-react"

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum(['INCOME', 'EXPENSE']),
  icon: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryFormProps {
  onSuccess?: () => void
}

export function CategoryForm({ onSuccess }: CategoryFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      type: 'EXPENSE',
      name: '',
      icon: ''
    }
  })

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setLoading(true)
      console.log(data)
      // TODO: Replace with actual user ID when auth is implemented
      await categoryService.create(data)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error(error)
      // Here we could add a toast notification for error
    } finally {
      setLoading(false)
    }
  }

  const type = form.watch('type')

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      
      {/* Tipo de Categoría */}
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
        disabled={loading}
        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Categoría'}
      </button>
    </form>
  )
}
