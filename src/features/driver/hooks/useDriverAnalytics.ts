import { useQuery } from '@tanstack/react-query'
import type { DriverAnalytics } from '@/types/driver'
import { driverKeys, type MonthCycle } from './useDriverShifts'

function analyticsUrl(cycle?: MonthCycle): string {
  if (!cycle) return '/api/driver/analytics'
  return `/api/driver/analytics?year=${cycle.year}&month=${cycle.month}`
}

export function useDriverAnalytics(cycle?: MonthCycle) {
  return useQuery({
    queryKey: driverKeys.analytics(cycle),
    queryFn: async (): Promise<DriverAnalytics> => {
      const res = await fetch(analyticsUrl(cycle))
      if (!res.ok) throw new Error('Error al cargar analytics')
      const json = await res.json()
      return json.data
    },
    staleTime: 1000 * 60 * 2,
  })
}
