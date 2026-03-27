// features/transactions/hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccounts, useUpdateAccount, accountKeys } from '@/features/accounts/hooks/useAccounts'
import type { Transaction, CreateTransactionData } from '@/types/transaction'
import { CreateTransactionInput } from '@/lib/validations/transaction.schema'
import { toast } from 'sonner'

async function authFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}

export const transactionKeys = {
  all:    ['transactions'] as const,
  lists:  () => [...transactionKeys.all, 'list'] as const,
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
}

// ─── Helpers de balance ───────────────────────────────────────────────────────
/**
 * Calcula los ajustes de balance necesarios para REVERTIR una transacción.
 * Se usa al eliminar.
 */
function getRevertBalanceOps(
  tx: Transaction,
  accounts: { id: string; balance: number }[]
): Array<{ id: string; balance: number }> {
  const source = accounts.find((a) => a.id === tx.account_id)
  const dest   = accounts.find((a) => a.id === tx.to_account_id)
  const ops: Array<{ id: string; balance: number }> = []

  switch (tx.type) {
    case 'INCOME':
      // Revertir ingreso → restar de la cuenta
      if (source) ops.push({ id: source.id, balance: source.balance - tx.amount })
      break
    case 'EXPENSE':
    case 'TRANSFER':
    case 'SAVING':
      // Revertir transferencia → sumar en origen, restar en destino
      if (source) ops.push({ id: source.id, balance: source.balance + tx.amount })
      if (dest)   ops.push({ id: dest.id,   balance: dest.balance   - tx.amount })
      break
  }

  return ops
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export function useTransactions() {
  return useQuery({
    queryKey: transactionKeys.lists(),
    queryFn: async (): Promise<Transaction[]> => {
      const res  = await authFetch('/api/transactions')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener las transacciones')

      // ← La API devuelve { data: [] }, no el array directo
      // Antes: return res.json()  ← devolvía el objeto wrapper completo
      return Array.isArray(json.data) ? json.data : []
    },
    staleTime: 1000 * 60 * 5,
  })
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export function useCreateTransaction() {
  const queryClient   = useQueryClient()
  const { data: accounts = [] } = useAccounts()
  const updateAccount = useUpdateAccount()

  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const sourceAccount = accounts.find((a) => a.id === data.account_id)
      const currency      = sourceAccount?.currency ?? 'BOB'
      const transactionData = { ...data, currency }

      if (data.type === 'INCOME' && sourceAccount) {
        await updateAccount.mutateAsync({
          id:   data.account_id,
          data: { balance: sourceAccount.balance + data.amount },
        })
      } else if (data.type === 'EXPENSE' && sourceAccount) {
        await updateAccount.mutateAsync({
          id:   data.account_id,
          data: { balance: sourceAccount.balance - data.amount },
        })
      } else if (data.type === 'TRANSFER' || data.type === 'SAVING') {
        const destAccount = accounts.find((a) => a.id === data.to_account_id)
        if (sourceAccount) {
          await updateAccount.mutateAsync({
            id:   data.account_id,
            data: { balance: sourceAccount.balance - data.amount },
          })
        }
        if (destAccount && data.to_account_id) {
          await updateAccount.mutateAsync({
            id:   data.to_account_id,
            data: { balance: destAccount.balance + data.amount },
          })
        }
      }

      const res  = await authFetch('/api/transactions', {
        method: 'POST',
        body:   JSON.stringify(transactionData),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al crear la transacción')
      return json.data
    },
    onSuccess: () => toast.success('Transacción registrada'),
    onError:   (error: Error) => toast.error(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
    },
  })
}

// ─── PATCH — solo campos que no afectan balance ───────────────────────────────
export type EditableTransactionFields = {
  category_id?:    string | null
  tag?:            string | null
  description?:    string | null
  project_id?:     string | null
  subtype?:        string | null
  date?:           string
  is_recurring?:   boolean
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditableTransactionFields }) => {
      const res  = await authFetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        body:   JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al actualizar la transacción')
      return json.data
    },
    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.lists() })
      const previous = queryClient.getQueryData<Transaction[]>(transactionKeys.lists())

      queryClient.setQueryData<Transaction[]>(transactionKeys.lists(), (old = []) =>
        old.map((t): Transaction =>
          t.id === id ? { ...t, ...data } as Transaction : t
        )
      )
      return { previous }
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(transactionKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSuccess: () => toast.success('Transacción actualizada'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
    },
  })
}

// ─── DELETE — revierte balance según tipo ─────────────────────────────────────
export function useDeleteTransaction() {
  const queryClient   = useQueryClient()
  const { data: accounts = [] } = useAccounts()
  const updateAccount = useUpdateAccount()

  return useMutation({
    mutationFn: async (tx: Transaction) => {
      // 1. Calcular y aplicar reversión de balances
      const ops = getRevertBalanceOps(tx, accounts)
      await Promise.all(
        ops.map((op) => updateAccount.mutateAsync({ id: op.id, data: { balance: op.balance } }))
      )

      // 2. Eliminar la transacción
      const res  = await authFetch(`/api/transactions/${tx.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al eliminar la transacción')
    },
    // Optimistic update — elimina de caché inmediatamente
    onMutate: async (tx) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.lists() })
      const previous = queryClient.getQueryData<Transaction[]>(transactionKeys.lists())
      queryClient.setQueryData<Transaction[]>(transactionKeys.lists(), (old = []) =>
        old.filter((t) => t.id !== tx.id)
      )
      return { previous }
    },
    onError: (error: Error, _tx, context) => {
      if (context?.previous) {
        queryClient.setQueryData(transactionKeys.lists(), context.previous)
      }
      toast.error(error.message)
    },
    onSuccess: () => toast.success('Transacción eliminada'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
    },
  })
}