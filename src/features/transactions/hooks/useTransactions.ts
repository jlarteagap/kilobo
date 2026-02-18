import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Transaction, CreateTransactionData } from '@/types/transaction'

async function authFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
}

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
}

// GET
export function useTransactions() {
  return useQuery({
    queryKey: transactionKeys.lists(),
    queryFn: async (): Promise<Transaction[]> => {
      const res = await authFetch('/api/transactions')
      if (!res.ok) throw new Error('Error al obtener las transacciones')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })
}

// POST
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTransactionData): Promise<Transaction> => {
      const res = await authFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear la transacción')
      }
      return res.json()
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.lists() })
      const previous = queryClient.getQueryData<Transaction[]>(transactionKeys.lists())

      const optimisticTransaction: Transaction = {
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'COMPLETED', // Default status
        recurrence_interval: null,
        user_id: 'current-user', // Should be replaced by real logic if needed
        to_account_id: newData.to_account_id ?? null,
        category_id: newData.category_id ?? null,
        description: newData.description ?? null,
        payment_method: newData.payment_method ?? null,
        is_recurring: newData.is_recurring ?? false,
        currency: newData.currency ?? 'BOB', // Default or from input
        ...newData,
      }

      queryClient.setQueryData<Transaction[]>(transactionKeys.lists(), (old = []) => [
        optimisticTransaction,
        ...old,
      ])

      return { previous }
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(transactionKeys.lists(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
    },
  })
}

// PUT
export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTransactionData> }) => {
      const res = await authFetch(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar la transacción')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
    },
  })
}

// DELETE
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar la transacción')
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.lists() })
      const previous = queryClient.getQueryData<Transaction[]>(transactionKeys.lists())
      queryClient.setQueryData<Transaction[]>(transactionKeys.lists(), (old = []) =>
        old.filter((t) => t.id !== id)
      )
      return { previous }
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(transactionKeys.lists(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
    },
  })
}
