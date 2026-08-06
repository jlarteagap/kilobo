import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { DriverConfig } from '@/types/driver'

const CONFIG_KEY = ['driver', 'config']

async function fetchConfig(): Promise<DriverConfig | null> {
  const res = await fetch('/api/driver/config')
  if (!res.ok) throw new Error('Error al cargar configuración')
  const json = await res.json()
  return json.data
}

async function saveConfigAction(data: DriverConfig): Promise<void> {
  const res = await fetch('/api/driver/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Error al guardar configuración')
  }
}

export function useDriverConfig() {
  return useQuery({
    queryKey: CONFIG_KEY,
    queryFn: fetchConfig,
    staleTime: Infinity, // la config no cambia seguido
  })
}

export function useSaveDriverConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DriverConfig) => {
      await saveConfigAction(data)
    },
    onSuccess: () => {
      toast.success('Configuración guardada')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONFIG_KEY })
    },
  })
}
