import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Category, CreateCategoryData } from '@/types/category'

// Cliente HTTP que añade el token automáticamente (simulado por ahora si no hay auth real)
async function authFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
}

export const categoryKeys = {
  all: ['category'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
}

// GET
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: async (): Promise<Category[]> => {
      const res = await authFetch('/api/categories')
      if (!res.ok) throw new Error('Error al obtener las categorías')
      return res.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// POST
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCategoryData): Promise<Category> => {
      const res = await authFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear la categoría')
      }
      return res.json()
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.lists() })
      const previous = queryClient.getQueryData<Category[]>(categoryKeys.lists())

      const optimisticCategory: Category = {
        id: `temp-${Date.now()}`,
        // Assuming default values for type safety in optimistic update
        // The actual response will correct this
        ...newData,
        parent_id: newData.parent_id ?? null,
        icon: newData.icon ?? null,
      }

      queryClient.setQueryData<Category[]>(categoryKeys.lists(), (old = []) => [
        ...old,
        optimisticCategory,
      ])

      return { previous }
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(categoryKeys.lists(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

// PUT
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCategoryData> }) => {
      const res = await authFetch(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar la categoría')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

// DELETE
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar la categoría')
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.lists() })
      const previous = queryClient.getQueryData<Category[]>(categoryKeys.lists())
      queryClient.setQueryData<Category[]>(categoryKeys.lists(), (old = []) =>
        old.filter((c) => c.id !== id)
      )
      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(categoryKeys.lists(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}
