// features/insights/hooks/useInsights.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { insightsService } from '@/services/insights.service'
import { InsightsResult } from '@/types/insights'

// ─── Keys ─────────────────────────────────────────────────────────────────────

export const insightKeys = {
  all    : ['insights']                                     as const,
  detail : (months: number) =>
             [...insightKeys.all, months]                   as const,
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchInsights(months: number): Promise<InsightsResult> {
  const tzOffset = new Date().getTimezoneOffset()
  const res = await fetch(`/api/insights?months=${months}&tzOffset=${tzOffset}`)
  if (!res.ok) throw new Error('Failed to fetch insights')
  const json = await res.json()
  return json.data
}

async function refreshInsights(months: number): Promise<InsightsResult> {
  const tzOffset = new Date().getTimezoneOffset()
  const res = await fetch('/api/insights', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ months, tzOffset }),
  })
  if (!res.ok) throw new Error('Failed to refresh insights')
  const json = await res.json()
  return json.data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useInsights(months: number = 3) {
  return useQuery({
    queryKey    : insightKeys.detail(months),
    queryFn     : () => fetchInsights(months),
    staleTime   : 1000 * 60 * 60,    // 1h — no refetch si el caché es reciente
    gcTime      : 1000 * 60 * 60 * 2, // 2h en memoria
    retry       : 1,
    refetchOnWindowFocus: false,       // análisis financiero no necesita refetch agresivo
  })
}

export function useRefreshInsights(months: number = 3) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => refreshInsights(months),
    onSuccess : (data) => {
      // Actualiza el caché de React Query directamente con el nuevo resultado
      queryClient.setQueryData(insightKeys.detail(months), data)
    },
  })
}