import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/http'
import type { UserPreferences } from '@/repositories/user-preferences.repository'

export const preferencesKeys = {
  all: ['user-preferences'] as const,
}

export function useUserPreferences() {
  return useQuery({
    queryKey: preferencesKeys.all,
    queryFn: async (): Promise<UserPreferences> => {
      const res = await apiFetch('/api/user/preferences')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener las preferencias')
      return json.data as UserPreferences
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      const res = await apiFetch('/api/user/preferences', {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al guardar las preferencias')
      return json.data as UserPreferences
    },
    onSuccess: (data) => {
      queryClient.setQueryData(preferencesKeys.all, data)
      toast.success('Preferencias guardadas')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}