// features/debts/hooks/useDebts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountKeys } from '@/features/accounts/hooks/useAccounts'
import { toast } from 'sonner'
import type { Debt, DebtSummary } from '@/types/debt'
import type { CreateDebtInput, CreateDebtPaymentInput } from '@/lib/validations/debt.schema'

async function authFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}

export const debtKeys = {
  all:      ['debts'] as const,
  lists:    () => [...debtKeys.all, 'list'] as const,
  detail:   (id: string) => [...debtKeys.all, 'detail', id] as const,
  payments: (id: string) => [...debtKeys.all, 'payments', id] as const,
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export function useDebts() {
  return useQuery({
    queryKey: debtKeys.lists(),
    queryFn:  async (): Promise<Debt[]> => {
      const res  = await authFetch('/api/debts')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener las deudas')
      return Array.isArray(json.data) ? json.data : []
    },
    staleTime: 1000 * 60 * 5,
  })
}

// ─── Summary calculado desde caché — sin llamada extra ───────────────────────
export function useDebtSummary(): DebtSummary {
  const { data: debts = [] } = useDebts()

  const activeDebts = debts.filter((d) => d.status === 'ACTIVE')

  return {
    totalGiven:      debts
      .filter((d) => d.type === 'GIVEN')
      .reduce((sum, d) => sum + d.amount, 0),

    totalReceived:   debts
      .filter((d) => d.type === 'RECEIVED')
      .reduce((sum, d) => sum + d.amount, 0),

    pendingGiven:    activeDebts
      .filter((d) => d.type === 'GIVEN')
      .reduce((sum, d) => sum + (d.amount - d.paid_amount), 0),

    pendingReceived: activeDebts
      .filter((d) => d.type === 'RECEIVED')
      .reduce((sum, d) => sum + (d.amount - d.paid_amount), 0),
  }
}

// ─── POST — crear deuda ───────────────────────────────────────────────────────
export function useCreateDebt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateDebtInput) => {
      const res  = await authFetch('/api/debts', {
        method: 'POST',
        body:   JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al crear la deuda')
      return json.data as Debt
    },
    onSuccess: () => toast.success('Deuda registrada'),
    onError:   (error: Error) => toast.error(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: debtKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
    },
  })
}

// ─── POST — registrar pago ────────────────────────────────────────────────────
export function useRegisterPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      debtId,
      data,
    }: {
      debtId: string
      data:   CreateDebtPaymentInput
    }) => {
      const res  = await authFetch(`/api/debts/${debtId}`, {
        method: 'POST',
        body:   JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al registrar el pago')
      return json.data
    },
    // Optimistic update — actualizar paid_amount y status en caché
    onMutate: async ({ debtId, data }) => {
      await queryClient.cancelQueries({ queryKey: debtKeys.lists() })
      const previous = queryClient.getQueryData<Debt[]>(debtKeys.lists())

      queryClient.setQueryData<Debt[]>(debtKeys.lists(), (old = []) =>
        old.map((d): Debt => {
          if (d.id !== debtId) return d
          const newPaidAmount = d.paid_amount + data.amount
          return {
            ...d,
            paid_amount: newPaidAmount,
            status: newPaidAmount >= d.amount ? 'PAID' : 'ACTIVE',
          }
        })
      )
      return { previous }
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(debtKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSuccess: () => toast.success('Pago registrado'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: debtKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
    },
  })
}

// ─── PATCH — cancelar deuda ───────────────────────────────────────────────────
export function useCancelDebt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (debtId: string) => {
      const res  = await authFetch(`/api/debts/${debtId}`, { method: 'PATCH' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al cancelar la deuda')
      return json.data as Debt
    },
    onMutate: async (debtId) => {
      await queryClient.cancelQueries({ queryKey: debtKeys.lists() })
      const previous = queryClient.getQueryData<Debt[]>(debtKeys.lists())
      queryClient.setQueryData<Debt[]>(debtKeys.lists(), (old = []) =>
        old.map((d): Debt =>
          d.id === debtId ? { ...d, status: 'CANCELLED' } : d
        )
      )
      return { previous }
    },
    onError: (error: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(debtKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSuccess: () => toast.success('Deuda cancelada'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: debtKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
    },
  })
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export function useDeleteDebt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (debtId: string) => {
      const res  = await authFetch(`/api/debts/${debtId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al eliminar la deuda')
    },
    onMutate: async (debtId) => {
      await queryClient.cancelQueries({ queryKey: debtKeys.lists() })
      const previous = queryClient.getQueryData<Debt[]>(debtKeys.lists())
      queryClient.setQueryData<Debt[]>(debtKeys.lists(), (old = []) =>
        old.filter((d) => d.id !== debtId)
      )
      return { previous }
    },
    onError: (error: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(debtKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSuccess: () => toast.success('Deuda eliminada'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: debtKeys.lists() })
    },
  })
}