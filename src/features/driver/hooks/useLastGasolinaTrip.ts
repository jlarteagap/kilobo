import { useQuery } from '@tanstack/react-query'
import { getLastTripAction } from '@/app/gasolina/actions'
import type { GasolinaLastTrip } from '@/types/driver'

export const gasolinaLastTripKey = ['gasolina', 'last-trip'] as const

/**
 * Ultimo km registrado en Gasolina. `staleTime: 0` a proposito: el formulario
 * se abre para registrar el turno de ahora, y una lectura cacheada de hace 5
 * minutos haria que la vista previa de la brecha mintiera.
 */
export function useLastGasolinaTrip() {
  return useQuery<GasolinaLastTrip | null>({
    queryKey: gasolinaLastTripKey,
    queryFn: () => getLastTripAction(),
    staleTime: 0,
    retry: false,
  })
}
