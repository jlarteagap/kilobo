import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccounts, useUpdateAccount, accountKeys } from '@/features/accounts/hooks/useAccounts'
import { Transaction, CreateTransactionData } from '@/types/transaction'
import { CreateTransactionInput } from '@/lib/validations/transaction.schema'

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
  const { data: accounts = [] } = useAccounts()
  const updateAccount = useUpdateAccount()

  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      // 1. Obtener moneda de la cuenta origen
      const sourceAccount = accounts.find((a) => a.id === data.account_id)
      const currency = sourceAccount?.currency ?? "BOB"

      const transactionData = { ...data, currency }

      // 2. Actualizar balances según tipo
      if (data.type === "INCOME") {
        // Sumar a la cuenta destino
        if (sourceAccount) {
          await updateAccount.mutateAsync({
            id: data.account_id,
            data: { balance: sourceAccount.balance + data.amount },
          })
        }
      } else if (data.type === "EXPENSE" || data.type === "DEBT") {
        // Restar de la cuenta origen
        if (sourceAccount) {
          await updateAccount.mutateAsync({
            id: data.account_id,
            data: { balance: sourceAccount.balance - data.amount },
          })
        }
      } else if (data.type === "TRANSFER" || data.type === "SAVING") {
        // Restar de origen y sumar a destino
        const destAccount = accounts.find((a) => a.id === data.to_account_id)

        if (sourceAccount) {
          await updateAccount.mutateAsync({
            id: data.account_id,
            data: { balance: sourceAccount.balance - data.amount },
          })
        }

        if (destAccount && data.to_account_id) {
          await updateAccount.mutateAsync({
            id: data.to_account_id,
            data: { balance: destAccount.balance + data.amount },
          })
        }
      }

      // 3. Crear la transacción
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Error al crear la transacción")
      }

      return res.json()
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
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
