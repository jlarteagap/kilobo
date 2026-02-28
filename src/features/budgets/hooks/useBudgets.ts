// features/budgets/hooks/useBudgets.ts
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { startOfDay, subDays, isAfter, isEqual, format } from 'date-fns'

import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { transactionKeys } from '@/features/transactions/hooks/useTransactions'
import type { Budget, BudgetProgress, BudgetSummaryData } from '@/types/budget'
import type { CreateBudgetInput, UpdateBudgetInput } from '@/lib/validations/budget.schema'
import type { Transaction } from '@/types/transaction'

async function authFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}

// ─── Query keys ───────────────────────────────────────────────────────────────
export const budgetKeys = {
  all:    ['budgets'] as const,
  lists:  () => [...budgetKeys.all, 'list'] as const,
  detail: (id: string) => [...budgetKeys.all, 'detail', id] as const,
}

// ─── Helper: calcular progreso de un budget ───────────────────────────────────
function calcProgress(
  budget:       Budget,
  transactions: Transaction[]
): BudgetProgress {
  const now        = new Date()
  const currentMonth = format(now, 'yyyy-MM')

  // Filtrar transacciones del mes actual vinculadas a las categorías del budget
  const linked = transactions.filter((t) => {
    const txMonth = t.date.slice(0, 7)  // "yyyy-MM"
    const inMonth = txMonth === currentMonth
    const inCats  = !!t.category_id && budget.category_ids.includes(t.category_id)

    if (!inMonth || !inCats) return false

    // INCOME_SOURCE → solo INCOME
    // FIXED_EXPENSE → solo EXPENSE
    // SAVINGS_GOAL  → solo INCOME
    if (budget.type === 'INCOME_SOURCE') return t.type === 'INCOME'
    if (budget.type === 'FIXED_EXPENSE') return t.type === 'EXPENSE'
    if (budget.type === 'SAVINGS_GOAL')  return t.type === 'INCOME'
    return false
  })

  const current_amount = linked.reduce((sum, t) => sum + t.amount, 0)
  const percent        = Math.min((current_amount / budget.target_amount) * 100, 100)
  const remaining      = budget.target_amount - current_amount

  // ── Días hasta vencimiento ─────────────────────────────────────────────────
  let days_until_due: number | null = null
  let is_overdue = false

  if (budget.due_day) {
    const dueDate  = new Date(now.getFullYear(), now.getMonth(), budget.due_day)
    const today    = startOfDay(now)
    const dueDateStart = startOfDay(dueDate)

    days_until_due = Math.ceil(
      (dueDateStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    is_overdue = days_until_due < 0 && percent < 100
  }

  // ── Status ─────────────────────────────────────────────────────────────────
  let status: BudgetProgress['status']

  if (percent >= 100) {
    status = 'COMPLETED'
  } else if (is_overdue) {
    status = 'OVERDUE'
  } else if (budget.due_day) {
    // AT_RISK: estamos en la segunda mitad del mes y llevamos menos del 50%
    const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth   = now.getDate()
    const halfwayPoint = daysInMonth / 2
    status = dayOfMonth > halfwayPoint && percent < 50 ? 'AT_RISK' : 'ON_TRACK'
  } else {
    status = 'ON_TRACK'
  }

  return {
    budget,
    current_amount,
    target_amount: budget.target_amount,
    percent,
    remaining,
    days_until_due,
    is_overdue,
    status,
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export function useBudgets() {
  return useQuery({
    queryKey: budgetKeys.lists(),
    queryFn:  async (): Promise<Budget[]> => {
      const res  = await authFetch('/api/budgets')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener los presupuestos')
      return Array.isArray(json.data) ? json.data : []
    },
    staleTime: 1000 * 60 * 5,
  })
}

// ─── Progress — calculado desde caché, sin llamada extra ─────────────────────
export function useBudgetProgress(): BudgetProgress[] {
  const { data: budgets      = [] } = useBudgets()
  const { data: transactions = [] } = useTransactions()

  return useMemo(() => {
    const active = budgets.filter((b) => b.is_active)
    return active.map((budget) => calcProgress(budget, transactions))
  }, [budgets, transactions])
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
      const res  = await authFetch('/api/budgets', {
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
      const res  = await authFetch(`/api/budgets/${id}`, {
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
      const res  = await authFetch(`/api/budgets/${id}`, { method: 'PUT' })
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
      const res  = await authFetch(`/api/budgets/${id}`, { method: 'DELETE' })
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