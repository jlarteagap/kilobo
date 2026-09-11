import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Account, CreateAccountData, UpdateAccountData } from '@/types/account'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/http'

// Query keys centralizadas — evita typos y facilita invalidación
export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  detail: (id: string) => [...accountKeys.all, 'detail', id] as const,
}

// Invalida también el badge de último cambio cuando las cuentas mutan
const balanceChangeKeys = ['account-balance-changes']

// GET
export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.lists(),
    queryFn: async (): Promise<Account[]> => {
      const res = await apiFetch('/api/accounts')
      if (!res.ok) throw new Error('Error al obtener las cuentas')
      return res.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutos en caché
  })
}

// Cuentas activas (no archivadas) para pickers, dashboard y cálculo de patrimonio.
export function useActiveAccounts() {
  const query = useAccounts()
  return {
    ...query,
    data: (query.data ?? []).filter((account) => !account.archived),
  }
}

// POST con optimistic update
export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAccountData): Promise<Account> => {
      const res = await apiFetch('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear la cuenta')
      }
      return res.json()
    },

    // Optimistic update: la UI se actualiza antes de que llegue la respuesta
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.lists() })
      const previous = queryClient.getQueryData<Account[]>(accountKeys.lists())

      const optimisticAccount: Account = {
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...newData,
      }

      queryClient.setQueryData<Account[]>(accountKeys.lists(), (old = []) => [
        optimisticAccount,
        ...old,
      ])

      return { previous } // contexto para rollback
    },

// En useDeleteAccount, reemplazar el onError
onError: (error: Error, _id, context) => {
  if (context?.previous) {
    queryClient.setQueryData(accountKeys.lists(), context.previous)
  }
  toast.error(error.message)  // ← muestra "No se puede eliminar..." directamente
},

    onSettled: () => {
      // Siempre revalida al final para tener datos reales
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      queryClient.invalidateQueries({ queryKey: balanceChangeKeys })
    },
  })
}

// PUT
export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAccountData }) => {
      const res = await apiFetch(`/api/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar la cuenta')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      queryClient.invalidateQueries({ queryKey: balanceChangeKeys })
    },
  })
}

// DELETE
export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/accounts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar la cuenta')
      }
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.lists() })
      const previous = queryClient.getQueryData<Account[]>(accountKeys.lists())
      queryClient.setQueryData<Account[]>(accountKeys.lists(), (old = []) =>
        old.filter((a) => a.id !== id)
      )
      return { previous }
    },

    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(accountKeys.lists(), context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      queryClient.invalidateQueries({ queryKey: balanceChangeKeys })
    },
  })
}