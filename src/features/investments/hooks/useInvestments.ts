import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Investment, CreateInvestmentData, UpdateInvestmentData, InvestmentTransaction } from '@/types/investment'
import type { BuyInvestmentInput, SellInvestmentInput } from '@/lib/validations/investment.schema'
import { accountKeys } from '@/features/accounts/hooks/useAccounts'
import { toast } from 'sonner'

async function authFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}

export const investmentKeys = {
  all:    ['investments'] as const,
  lists:  () => [...investmentKeys.all, 'list'] as const,
  detail: (id: string) => [...investmentKeys.all, 'detail', id] as const,
  transactions: (investmentId: string) => [...investmentKeys.all, 'transactions', investmentId] as const,
}

export function useInvestments() {
  return useQuery({
    queryKey: investmentKeys.lists(),
    queryFn: async (): Promise<Investment[]> => {
      const res  = await authFetch('/api/investments')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener las inversiones')
      return Array.isArray(json.data) ? json.data : []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useInvestmentTransactions(investmentId: string) {
  return useQuery({
    queryKey: investmentKeys.transactions(investmentId),
    queryFn: async (): Promise<InvestmentTransaction[]> => {
      const res  = await authFetch(`/api/investments/${investmentId}/transactions`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener transacciones')
      return Array.isArray(json.data) ? json.data : []
    },
    enabled: !!investmentId,
  })
}

export function useCreateInvestment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateInvestmentData): Promise<Investment> => {
      const res  = await authFetch('/api/investments', {
        method: 'POST',
        body:   JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al crear la inversión')
      return json.data
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
    },
  })
}

export function useBuyInvestment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BuyInvestmentInput) => {
      const res  = await authFetch(`/api/investments/${data.investment_id}/transactions`, {
        method: 'POST',
        body:   JSON.stringify({ ...data, type: 'BUY' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al registrar compra')
      return json
    },
    onSuccess: (_data, variables) => {
      toast.success('Compra registrada')
      queryClient.invalidateQueries({ queryKey: investmentKeys.transactions(variables.investment_id) })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
    },
  })
}

export function useSellInvestment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SellInvestmentInput) => {
      const res  = await authFetch(`/api/investments/${data.investment_id}/transactions`, {
        method: 'POST',
        body:   JSON.stringify({ ...data, type: 'SELL' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al registrar venta')
      return json
    },
    onSuccess: (_data, variables) => {
      toast.success('Venta registrada')
      queryClient.invalidateQueries({ queryKey: investmentKeys.transactions(variables.investment_id) })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
    },
  })
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInvestmentData }) => {
      const res  = await authFetch(`/api/investments/${id}`, {
        method: 'PUT',
        body:   JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al actualizar la inversión')
      return json.data
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
    },
  })
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res  = await authFetch(`/api/investments/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al eliminar la inversión')
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: investmentKeys.lists() })
      const previous = queryClient.getQueryData<Investment[]>(investmentKeys.lists())
      queryClient.setQueryData<Investment[]>(investmentKeys.lists(), (old = []) =>
        old.filter((inv) => inv.id !== id)
      )
      return { previous }
    },
    onError: (error: Error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(investmentKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
    },
  })
}
