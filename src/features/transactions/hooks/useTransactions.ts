// features/transactions/hooks/useTransactions.ts
import { useMemo } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountKeys } from '@/features/accounts/hooks/useAccounts'
import type { Transaction } from '@/types/transaction'
import { CreateTransactionInput } from '@/lib/validations/transaction.schema'

import { toast } from 'sonner'
import { apiFetch } from '@/lib/http'

export const transactionKeys = {
  all:    ['transactions'] as const,
  lists:  () => [...transactionKeys.all, 'list'] as const,
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
}

// ─── GET — paginado por cursor ────────────────────────────────────────────────
export interface TransactionFilters {
  from?: string
  to?: string
  accountId?: string
  categoryId?: string
  projectId?: string
  tag?: string
  type?: string
}

export interface TransactionPage {
  items: Transaction[]
  nextCursor: string | null
}

/**
 * Listado paginado. Antes devolvía el historial completo en cada visita, que
 * costaba una lectura por transacción y crecía con la antigüedad de la cuenta.
 *
 * Los filtros van al servidor a propósito: filtrar en el navegador obligaría a
 * traer el historial entero para descartar lo que no coincide, y las páginas
 * Mostrarían totales calculados sobre un subconjunto sin avisar.
 */
export function useTransactions(filters: TransactionFilters = {}) {
  return useInfiniteQuery({
    queryKey: [...transactionKeys.lists(), filters],
    queryFn: async ({ pageParam }): Promise<TransactionPage> => {
      const params = new URLSearchParams()
      if (pageParam) params.set('cursor', pageParam)
      for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v)

      const res  = await apiFetch(`/api/transactions?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener las transacciones')

      return {
        items: Array.isArray(json.data) ? json.data : [],
        nextCursor: json.nextCursor ?? null,
      }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Totales del conjunto filtrado, calculados en el servidor.
 *
 * Van aparte de la lista porque su alcance es el conjunto completo, no lo que
 * el usuario ha recorrrido. Mezclarlos daría totales de una página presentados
 * como si fueran del filtro.
 */
export function useTransactionTotals(filters: TransactionFilters) {
  return useQuery({
    queryKey: [...transactionKeys.all, 'totals', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v)
      const res = await apiFetch(`/api/transactions/totals?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener los totales')
      return json.data as { total: number; income: number; expense: number; net: number }
    },
    staleTime: 1000 * 60 * 2,
  })
}

/** Aplana las páginas cargadas. Solo contiene lo que el usuario ha recorrido. */
export function useTransactionsList(filters?: TransactionFilters): Transaction[] {
  const { data } = useTransactions(filters)
  return useMemo(() => (data?.pages ?? []).flatMap((p) => p.items), [data])
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export function useCreateTransaction() {
  const queryClient   = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const res  = await apiFetch('/api/transactions', {
        method: 'POST',
        body:   JSON.stringify(data),
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
      const res  = await apiFetch(`/api/transactions/${id}`, {
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

// ─── DELETE — revierte balance según tipo (server-side) ──────────────────────
export function useDeleteTransaction() {
  const queryClient   = useQueryClient()

  return useMutation({
    mutationFn: async (tx: Transaction) => {
      const res  = await apiFetch(`/api/transactions/${tx.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al eliminar la transacción')
    },
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