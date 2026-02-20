import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {toast} from 'sonner'
import { Category, CreateCategoryDTO } from '@/types/category'

// Cliente HTTP que añade el token automáticamente (simulado por ahora si no hay auth real)

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
}
// ─── Fetchers ────────────────────────────────────────────────────────────────
async function fetchCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories')
  const json = await res.json()

  if (!res.ok) throw new Error(json.error ?? 'Error desconocido')

  return Array.isArray(json.data) ? json.data : []  // ← return explícito
}

async function createCategory(dto: CreateCategoryDTO): Promise<Category> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  })
  if (!res.ok) throw new Error('Error al crear categoría')
  const json = await res.json()
  return json
}

async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al eliminar categoría')
}
// ─── Hooks ───────────────────────────────────────────────────────────────────
export function useCategories() {
  const result = useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5,
  })

  console.log('useCategories →', {
    status: result.status,
    data: result.data,
    error: result.error,
    fetchStatus: result.fetchStatus,
  })

  return result
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      toast.success('Categoría creada correctamente')
    },
    onError: () => {
      toast.error('Error al crear la categoría')
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCategory,
    // Optimistic update: elimina de la caché antes de que responda el servidor
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.lists() })
      const previous = queryClient.getQueryData<Category[]>(categoryKeys.lists())
      queryClient.setQueryData<Category[]>(categoryKeys.lists(), (old) =>
        old?.filter((c) => c.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      // Rollback si falla
      if (context?.previous) {
        queryClient.setQueryData(categoryKeys.lists(), context.previous)
      }
      toast.error('Error al eliminar la categoría')
    },
    onSuccess: () => {
      toast.success('Categoría eliminada')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}