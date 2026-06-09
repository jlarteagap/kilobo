import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { accountKeys } from '@/features/accounts/hooks/useAccounts'
import { transactionKeys } from '@/features/transactions/hooks/useTransactions'
import type { Credit, Installment, CreditType } from '@/types/credit'
import type { CreateCreditInput } from '@/lib/validations/credit.schema'

async function authFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}

export const creditKeys = {
  all:        ['credits'] as const,
  lists:      () => [...creditKeys.all, 'list'] as const,
  detail:     (id: string) => [...creditKeys.all, 'detail', id] as const,
  details:    () => [...creditKeys.all, 'detail'] as const,
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export function useCredits() {
  return useQuery({
    queryKey: creditKeys.lists(),
    queryFn:  async (): Promise<Credit[]> => {
      const res  = await authFetch('/api/credits')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener los créditos')
      return Array.isArray(json.data) ? json.data : []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreditDetail(id: string) {
  return useQuery({
    queryKey: creditKeys.detail(id),
    queryFn:  async (): Promise<{ credit: Credit; installments: Installment[] }> => {
      const res  = await authFetch(`/api/credits/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener el crédito')
      return json.data
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}

// ─── POST — crear crédito ─────────────────────────────────────────────────────
export function useCreateCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCreditInput) => {
      const res  = await authFetch('/api/credits', {
        method: 'POST',
        body:   JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al crear el crédito')
      return json.data as Credit
    },
    onSuccess: () => toast.success('Crédito registrado'),
    onError:   (error: Error) => toast.error(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: creditKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
    },
  })
}

// ─── PATCH — cancelar crédito ─────────────────────────────────────────────────
export function useCancelCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res  = await authFetch(`/api/credits/${id}`, { method: 'PATCH' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al cancelar el crédito')
      return json.data as Credit
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: creditKeys.lists() })
      const previous = queryClient.getQueryData<Credit[]>(creditKeys.lists())
      queryClient.setQueryData<Credit[]>(creditKeys.lists(), (old = []) =>
        old.map((c): Credit => c.id === id ? { ...c, status: 'CANCELLED' as const } : c)
      )
      return { previous }
    },
    onError: (error: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(creditKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSuccess: () => toast.success('Crédito cancelado'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: creditKeys.lists() })
    },
  })
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export function useDeleteCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res  = await authFetch(`/api/credits/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al eliminar el crédito')
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: creditKeys.lists() })
      const previous = queryClient.getQueryData<Credit[]>(creditKeys.lists())
      queryClient.setQueryData<Credit[]>(creditKeys.lists(), (old = []) =>
        old.filter((c) => c.id !== id)
      )
      return { previous }
    },
    onError: (error: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(creditKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSuccess: () => toast.success('Crédito eliminado'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: creditKeys.lists() })
    },
  })
}

// ─── POST — pagar cuotas ──────────────────────────────────────────────────────
export function usePayInstallments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      creditId,
      data,
    }: {
      creditId: string
      data: { installment_ids: string[]; amount: number; account_id: string }
    }) => {
      const res  = await authFetch(`/api/credits/${creditId}/pay`, {
        method: 'POST',
        body:   JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al pagar las cuotas')
    },
    onSuccess: () => toast.success('Cuotas pagadas'),
    onError:   (error: Error) => toast.error(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: creditKeys.lists() })
      queryClient.invalidateQueries({ queryKey: creditKeys.details() })   // invalidates all details
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
    },
  })
}
