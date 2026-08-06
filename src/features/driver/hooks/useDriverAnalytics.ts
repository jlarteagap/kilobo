import { useQuery } from '@tanstack/react-query'
import type { DriverAnalytics } from '@/types/driver'
import { driverKeys } from './useDriverShifts'

export function useDriverAnalytics() {
  return useQuery({
    queryKey: driverKeys.analytics(),
    queryFn: async (): Promise<DriverAnalytics> => {
      const res = await fetch('/api/driver/analytics')
      if (!res.ok) throw new Error('Error al cargar analytics')
      const json = await res.json()
      return json.data
    },
    staleTime: 1000 * 60 * 2,
  })
}
