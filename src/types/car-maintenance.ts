// src/types/car-maintenance.ts
// Tipos y constantes del mantenimiento del auto. Viven fuera del repositorio
// porque los componentes cliente los necesitan y `repositories/` arrastra
// firebase-admin al bundle.

export type MaintenanceType = 'oil' | 'injectors'

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  oil: 'Cambio de Aceite',
  injectors: 'Aditivo de Gasolina',
}

export interface CarMaintenanceLog {
  id: string
  type: MaintenanceType
  cost: number
  odometer: number
  date: number
  notes?: string
  /**
   * Gasto generado en la cuenta de finanzas cuando este mantenimiento se
   * descontó del fondo de mantenimiento del conductor. Si existe, al borrar el
   * log hay que revertir esa transacción.
   */
  transaction_id?: string | null
}

export interface CarConfig {
  absoluteOdometer: number
}