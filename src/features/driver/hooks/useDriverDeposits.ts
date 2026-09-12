import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { DriverDeposit, DepositInput, DriverDepositReconciliation } from '@/types/driver'
import { driverKeys, type MonthCycle } from './useDriverShifts'
import { apiFetch } from '@/lib/http'

function depositsUrl(cycle?: MonthCycle): string {
  if (!cycle) {
    const now = new Date()
    return `/api/driver/deposits?year=${now.getFullYear()}&month=${now.getMonth() + 1}`
  }
  return `/api/driver/deposits?year=${cycle.year}&month=${cycle.month}`
}

export function useDriverDeposits(cycle?: MonthCycle) {
  return useQuery({
    queryKey: driverKeys.deposits(cycle),
    queryFn: async (): Promise<DriverDeposit[]> => {
      const res = await apiFetch(depositsUrl(cycle))
      if (!res.ok) throw new Error('Error al cargar depósitos')
      const json = await res.json()
      return json.data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useDriverDepositsReconciliation() {
  return useQuery({
    queryKey: driverKeys.reconciliation(),
    queryFn: async (): Promise<DriverDepositReconciliation[]> => {
      const res = await apiFetch('/api/driver/deposits/reconciliation')
      if (!res.ok) throw new Error('Error al cargar conciliación')
      const json = await res.json()
      return json.data
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateDriverDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DepositInput) => {
      const res = await apiFetch('/api/driver/deposits', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error ?? 'Error al registrar depósito')
      }
      return res.json()
    },
    onSuccess: () => toast.success('Depósito registrado'),
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['driver'] }),
  })
}

export function useUpdateDriverDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DepositInput }) => {
      const res = await apiFetch(`/api/driver/deposits/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error ?? 'Error al actualizar depósito')
      }
      return res.json()
    },
    onSuccess: () => toast.success('Depósito actualizado'),
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['driver'] }),
  })
}

export function useDeleteDriverDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/driver/deposits/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error ?? 'Error al eliminar depósito')
      }
    },
    onSuccess: () => toast.success('Depósito eliminado'),
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['driver'] }),
  })
}