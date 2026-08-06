import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { DriverShift, ShiftInput } from '@/types/driver'
import { createShiftAction } from '@/app/conductor/actions'

async function authFetch(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Error al cargar datos')
  const json = await res.json()
  return json.data
}

export const driverKeys = {
  all: ['driver'] as const,
  shifts: () => [...driverKeys.all, 'shifts'] as const,
  analytics: () => [...driverKeys.all, 'analytics'] as const,
}

export function useShifts() {
  return useQuery({
    queryKey: driverKeys.shifts(),
    queryFn: (): Promise<DriverShift[]> => authFetch('/api/driver/shifts'),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ShiftInput) => {
      const result = await createShiftAction(data)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => toast.success('Turno registrado. Transacciones generadas.'),
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['driver'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useDeleteShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/driver/shifts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al eliminar turno')
      }
    },
    onSuccess: () => toast.success('Turno eliminado'),
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['driver'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ShiftInput }) => {
      const res = await fetch(`/api/driver/shifts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al actualizar turno')
      }
      return res.json()
    },
    onSuccess: () => toast.success('Turno actualizado'),
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['driver'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
