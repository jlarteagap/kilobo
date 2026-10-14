// features/budgets/hooks/useBudgets.ts
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics'

import type { Budget, BudgetProgress, BudgetSummaryData } from '@/types/budget'
import type { CreateBudgetInput, UpdateBudgetInput } from '@/lib/validations/budget.schema'
import { apiFetch } from '@/lib/http'

// ─── Query keys ───────────────────────────────────────────────────────────────
export const budgetKeys = {
  all:    ['budgets'] as const,
  lists:  () => [...budgetKeys.all, 'list'] as const,
  detail: (id: string) => [...budgetKeys.all, 'detail', id] as const,
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export function useBudgets() {
  return useQuery({
    queryKey: budgetKeys.lists(),
    queryFn:  async (): Promise<Budget[]> => {
      const res  = await apiFetch('/api/budgets')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener los presupuestos')
      return Array.isArray(json.data) ? json.data : []
    },
    staleTime: 1000 * 60 * 5,
  })
}

// ─── Progress — calculado en el servidor ────────────────────────────────────
//
// Antes filtraba el historial completo de transacciones una vez por presupuesto
// activo (O(presupuestos × transacciones)) en cada render. Ahora llega listo
// desde /api/dashboard/metrics, que además lo cachea.
export function useBudgetProgress(): BudgetProgress[] {
  const { data } = useDashboardMetrics()
  return useMemo(() => data?.budgetProgress ?? [], [data?.budgetProgress])
}

// ─── Summary global del mes ───────────────────────────────────────────────────
export function useBudgetSummary(): BudgetSummaryData {
  const progress = useBudgetProgress()

  return useMemo(() => {
    const totalIncome = progress
      .filter((p) => p.budget.type === 'INCOME_SOURCE')
      .reduce((sum, p) => sum + p.current_amount, 0)

    const totalFixedExpense = progress
      .filter((p) => p.budget.type === 'FIXED_EXPENSE')
      .reduce((sum, p) => sum + p.budget.target_amount, 0)

    const totalSavingsGoal = progress
      .filter((p) => p.budget.type === 'SAVINGS_GOAL')
      .reduce((sum, p) => sum + p.budget.target_amount, 0)

    const available = totalIncome - totalFixedExpense
    const isDeficit = available < 0

    return {
      totalIncome,
      totalFixedExpense,
      totalSavingsGoal,
      available,
      isDeficit,
    }
  }, [progress])
}

// ─── POST — crear ─────────────────────────────────────────────────────────────
export function useCreateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBudgetInput) => {
      const res  = await apiFetch('/api/budgets', {
        method: 'POST',
        body:   JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al crear el presupuesto')
      return json.data as Budget
    },
    onSuccess: () => toast.success('Presupuesto creado'),
    onError:   (error: Error) => toast.error(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
    },
  })
}

// ─── PATCH — actualizar ───────────────────────────────────────────────────────
export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBudgetInput }) => {
      const res  = await apiFetch(`/api/budgets/${id}`, {
        method: 'PATCH',
        body:   JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al actualizar el presupuesto')
      return json.data as Budget
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: budgetKeys.lists() })
      const previous = queryClient.getQueryData<Budget[]>(budgetKeys.lists())

      queryClient.setQueryData<Budget[]>(budgetKeys.lists(), (old = []) =>
        old.map((b) => b.id === id ? { ...b, ...data } : b)
      )
      return { previous }
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(budgetKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSuccess: () => toast.success('Presupuesto actualizado'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
    },
  })
}

// ─── PUT — archivar ───────────────────────────────────────────────────────────
export function useArchiveBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res  = await apiFetch(`/api/budgets/${id}`, { method: 'PUT' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al archivar el presupuesto')
      return json.data as Budget
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: budgetKeys.lists() })
      const previous = queryClient.getQueryData<Budget[]>(budgetKeys.lists())
      queryClient.setQueryData<Budget[]>(budgetKeys.lists(), (old = []) =>
        old.map((b) => b.id === id ? { ...b, is_active: false } : b)
      )
      return { previous }
    },
    onError: (error: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(budgetKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSuccess: () => toast.success('Presupuesto archivado'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
    },
  })
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res  = await apiFetch(`/api/budgets/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al eliminar el presupuesto')
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: budgetKeys.lists() })
      const previous = queryClient.getQueryData<Budget[]>(budgetKeys.lists())
      queryClient.setQueryData<Budget[]>(budgetKeys.lists(), (old = []) =>
        old.filter((b) => b.id !== id)
      )
      return { previous }
    },
    onError: (error: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(budgetKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSuccess: () => toast.success('Presupuesto eliminado'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
    },
  })
}