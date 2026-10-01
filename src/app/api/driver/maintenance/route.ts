// src/app/api/driver/maintenance/route.ts
import { getUserId } from '@/lib/auth.server'
import { driverConfigRepository } from '@/repositories/driver-config.repository'
import { carMaintenanceRepository } from '@/repositories/car-maintenance.repository'
import { accountsRepository } from '@/repositories/accounts.repository'
import {
  MAINTENANCE_TYPE_LABELS,
  maintenanceStatus,
  type MaintenanceType,
} from '@/types/car-maintenance'

const TYPES: MaintenanceType[] = ['oil', 'injectors']

/**
 * Estado del fondo de mantenimiento del conductor: cuanto dinero hay, y que tan
 * cerca esta el auto de cada servicio.
 *
 * Sirve para que `/conductor` pueda decir "te faltan Bs X para el proximo
 * aceite" sin que el cliente tenga que pedir cuentas y logs por separado. Los
 * logs y el odometro son globales (no tienen `user_id`), igual que en
 * `/gasolina`.
 */
export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const [config, absoluteOdometer, logs] = await Promise.all([
      driverConfigRepository.findByUserId(userId),
      carMaintenanceRepository.getAbsoluteOdometer(),
      carMaintenanceRepository.getMaintenanceLogs(),
    ])

    const fondoId = config?.maintenanceSavingsAccountId ?? null
    const fondo = fondoId ? await accountsRepository.findById(fondoId, userId) : null

    const fund = fondo
      ? { id: fondo.id, name: fondo.name, balance: fondo.balance, currency: fondo.currency }
      : null

    const services = TYPES.map((type) => {
      const last = logs.find((l) => l.type === type) ?? null
      const stats = maintenanceStatus(type, absoluteOdometer, last?.odometer ?? null)

      return {
        type,
        label: MAINTENANCE_TYPE_LABELS[type],
        ...stats,
        lastServiceOdometer: last?.odometer ?? null,
        lastServiceDate: last?.date ?? null,
        lastCost: last?.cost ?? null,
        /**
         * Dinero que falta para pagar este servicio con el fondo actual. Negativo
         * cuando el fondo ya cubre el costo estimado.
         */
        shortfall: Math.max(0, stats.estimatedCost - (fund?.balance ?? 0)),
      }
    })

    return Response.json({
      data: {
        configured: !!config,
        fund,
        absoluteOdometer,
        services,
      },
    })
  } catch (error: unknown) {
    console.error('GET /api/driver/maintenance error:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}