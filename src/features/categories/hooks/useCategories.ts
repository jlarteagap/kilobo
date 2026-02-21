// features/categories/hooks/useCategories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Category, CreateCategoryDTO, UpdateCategoryDTO } from '@/types/category'

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const categoryKeys = {
  all:   ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchCategories(): Promise<Category[]> {
  const res  = await fetch('/api/categories')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Error al obtener categorías')
  return Array.isArray(json.data) ? json.data : []
}

async function createCategory(dto: CreateCategoryDTO): Promise<Category> {
  const res  = await fetch('/api/categories', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(dto),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Error al crear categoría')
  return json.data
}

async function updateCategory({ id, data }: { id: string; data: UpdateCategoryDTO }): Promise<Category> {
  const res  = await fetch(`/api/categories/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  const json = await res.json()
  // 409 = tag o categoría en uso — propagamos el mensaje del servidor
  if (!res.ok) throw new Error(json.error ?? 'Error al actualizar categoría')
  return json.data
}

async function deleteCategory(id: string): Promise<void> {
  const res  = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Error al eliminar categoría')
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn:  fetchCategories,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      toast.success('Categoría creada correctamente')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateCategory,
    // Optimistic update — actualiza la caché antes de que responda el servidor
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.lists() })
      const previous = queryClient.getQueryData<Category[]>(categoryKeys.lists())

      queryClient.setQueryData<Category[]>(categoryKeys.lists(), (old) =>
        old?.map((c) => c.id === id ? { ...c, ...data } : c) ?? []
      )

      return { previous }
    },
    onError: (error: Error, _vars, context) => {
      // Rollback si falla (ej: tag en uso)
      if (context?.previous) {
        queryClient.setQueryData(categoryKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success('Categoría actualizada')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    // Optimistic update — elimina de la caché inmediatamente
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.lists() })
      const previous = queryClient.getQueryData<Category[]>(categoryKeys.lists())
      queryClient.setQueryData<Category[]>(categoryKeys.lists(), (old) =>
        old?.filter((c) => c.id !== id) ?? []
      )
      return { previous }
    },
    onError: (error: Error, _id, context) => {
      // Rollback — puede ser 409 si tiene transacciones
      if (context?.previous) {
        queryClient.setQueryData(categoryKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success('Categoría eliminada')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}