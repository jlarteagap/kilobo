import { useQuery } from '@tanstack/react-query'
import type { Account, CurrencyType } from '@/types/account'
import type { MaintenanceStatus, MaintenanceType } from '@/types/car-maintenance'

export interface MaintenanceService {
  type: MaintenanceType
  label: string
  intervalKm: number
  estimatedCost: number
  kmDriven: number
  kmRemaining: number
  ratio: number
  status: MaintenanceStatus
  nextServiceOdometer: number
  lastServiceOdometer: number | null
  lastServiceDate: number | null
  lastCost: number | null
  shortfall: number
}

export interface MaintenanceOverview {
  configured: boolean
  fund: Pick<Account, 'id' | 'name' | 'balance'> & { currency: CurrencyType } | null
  absoluteOdometer: number | null
  services: MaintenanceService[]
}

export const maintenanceKey = ['driver', 'maintenance'] as const

/**
 * Fondo de mantenimiento + estado de los proximos servicios del auto.
 *
 * Consume `/api/driver/maintenance`, que junta en una sola respuesta la config
 * del conductor, el saldo del fondo, el odometro y los ultimos logs. Son tres
 * fuentes distintas y sin esto habia que orquestarlas desde cada pagina.
 */
export function useMaintenance() {
  return useQuery({
    queryKey: maintenanceKey,
    queryFn: async (): Promise<MaintenanceOverview> => {
      const res = await fetch('/api/driver/maintenance')
      if (!res.ok) throw new Error('Error al cargar el fondo de mantenimiento')
      const json = await res.json()
      return json.data
    },
    staleTime: 1000 * 60 * 5,
  })
}