// src/types/car-maintenance.ts
// Tipos y constantes del mantenimiento del auto. Viven fuera del repositorio
// porque los componentes cliente los necesitan y `repositories/` arrastra
// firebase-admin al bundle.

export type MaintenanceType = 'oil' | 'injectors'

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  oil: 'Cambio de Aceite',
  injectors: 'Aditivo de Gasolina',
}

/**
 * Parametros de cada tipo de mantenimiento: cada cuantos km toca y cuanto
 * cuesta. Antes vivian duplicados dentro de `MaintenanceWidgets`, asi que el
 * unico lugar que sabia el costo era la pagina publica de Gasolina.
 *
 * `estimatedCost` es una aproximacion para dimensionar cuanto dinero falta
 * tener en el fondo; el gasto real sale del costo que carga el conductor.
 */
export const MAINTENANCE_INTERVALS: Record<
  MaintenanceType,
  { intervalKm: number; estimatedCost: number }
> = {
  oil: { intervalKm: 10_000, estimatedCost: 350 },
  injectors: { intervalKm: 4_000, estimatedCost: 180 },
}

/** Umbrales de avance para colorear la barra de progreso del proximo servicio. */
export const MAINTENANCE_WARNING_RATIO = 0.85

export type MaintenanceStatus = 'good' | 'warning' | 'danger'

/**
 * Estado de un tipo de mantenimiento: cuantos km faltan y si ya toco.
 *
 * Sin logs previos no hay contra que medir el avance, asi que se asume que el
 * auto recien entra en servicio y se reporta el intervalo completo.
 */
export function maintenanceStatus(
  type: MaintenanceType,
  absoluteOdometer: number | null,
  lastServiceOdometer: number | null,
): { intervalKm: number; estimatedCost: number; kmDriven: number; kmRemaining: number; ratio: number; status: MaintenanceStatus; nextServiceOdometer: number } {
  const { intervalKm, estimatedCost } = MAINTENANCE_INTERVALS[type]

  if (absoluteOdometer === null || lastServiceOdometer === null) {
    const odo = absoluteOdometer ?? 0
    return {
      intervalKm,
      estimatedCost,
      kmDriven: 0,
      kmRemaining: intervalKm,
      ratio: 0,
      status: 'good',
      nextServiceOdometer: odo + intervalKm,
    }
  }

  const kmDriven = Math.max(0, absoluteOdometer - lastServiceOdometer)
  const kmRemaining = intervalKm - kmDriven
  const ratio = intervalKm > 0 ? kmDriven / intervalKm : 0

  const status: MaintenanceStatus =
    ratio >= 1 ? 'danger' : ratio >= MAINTENANCE_WARNING_RATIO ? 'warning' : 'good'

  return {
    intervalKm,
    estimatedCost,
    kmDriven,
    kmRemaining,
    ratio,
    status,
    nextServiceOdometer: lastServiceOdometer + intervalKm,
  }
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