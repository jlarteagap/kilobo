import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SavingsGoal } from '@/types/savings-goal'
import type { CreateSavingsGoalInput, UpdateSavingsGoalInput } from '@/lib/validations/savings-goal.schema'

async function authFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}

export const savingsGoalKeys = {
  all: ['savings-goals'] as const,
  lists: () => [...savingsGoalKeys.all, 'list'] as const,
  detail: (id: string) => [...savingsGoalKeys.all, 'detail', id] as const,
}

export function useSavingsGoals() {
  return useQuery({
    queryKey: savingsGoalKeys.lists(),
    queryFn: async (): Promise<SavingsGoal[]> => {
      const res = await authFetch('/api/savings-goals')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener metas de ahorro')
      return Array.isArray(json.data) ? json.data : []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSavingsGoalInput) => {
      const res = await authFetch('/api/savings-goals', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al crear la meta')
      return json.data as SavingsGoal
    },
    onSuccess: () => toast.success('Meta de ahorro creada'),
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.lists() })
    },
  })
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSavingsGoalInput }) => {
      const res = await authFetch(`/api/savings-goals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al actualizar la meta')
      return json.data as SavingsGoal
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: savingsGoalKeys.lists() })
      const previous = queryClient.getQueryData<SavingsGoal[]>(savingsGoalKeys.lists())

      queryClient.setQueryData<SavingsGoal[]>(savingsGoalKeys.lists(), (old = []) =>
        old.map(g => g.id === id ? { ...g, ...data } as SavingsGoal : g)
      )
      return { previous }
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(savingsGoalKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSuccess: () => toast.success('Meta actualizada'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.lists() })
    },
  })
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/savings-goals/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Error al eliminar la meta')
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: savingsGoalKeys.lists() })
      const previous = queryClient.getQueryData<SavingsGoal[]>(savingsGoalKeys.lists())
      queryClient.setQueryData<SavingsGoal[]>(savingsGoalKeys.lists(), (old = []) =>
        old.filter(g => g.id !== id)
      )
      return { previous }
    },
    onError: (error: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(savingsGoalKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.lists() })
    },
  })
}
