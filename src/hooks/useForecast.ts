// hooks/useForecast.ts

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authFetch } from '@/lib/authFetch'
import { ForecastHorizon, ForecastResult } from '@/types/forecast'

async function fetchForecast(horizon: ForecastHorizon): Promise<ForecastResult> {
  const res = await authFetch(`/api/forecast?horizon=${horizon}`)
  if (!res.ok) throw new Error('Error al cargar el forecast')
  const json = await res.json()
  return json.data
}

export function useForecast() {
  const [horizon, setHorizon] = useState<ForecastHorizon>(30)

  const query = useQuery({
    queryKey: ['forecast', horizon],
    queryFn: () => fetchForecast(horizon),
    // El forecast no cambia en tiempo real — revalidar cada 5 minutos
    staleTime: 5 * 60 * 1000,
    // Mantener data anterior mientras carga el nuevo horizonte
    placeholderData: (prev) => prev,
  })

  return {
    ...query,
    horizon,
    setHorizon,
  }
}
