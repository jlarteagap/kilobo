'use server'

import { revalidatePath } from 'next/cache'
import { carMaintenanceRepository } from '@/repositories/car-maintenance.repository'
import { MAINTENANCE_TYPE_LABELS, type CarMaintenanceLog, type MaintenanceType } from '@/types/car-maintenance'
import { driverConfigRepository } from '@/repositories/driver-config.repository'
import { accountsRepository } from '@/repositories/accounts.repository'
import { transactionService } from '@/services/transactions.service'
import { getUserId } from '@/lib/auth.server'
import { hasCarAccess } from '@/lib/car-access'

/**
 * Misma puerta que las acciones de ciclos (design.md D1): el estado de
 * mantenimiento también es compartido, no pertenece a un usuario, así que la
 * escritura la gobierna el token compartido y no la sesión.
 *
 * Conviven dos controles distintos a propósito: el token responde "¿puede
 * modificar el auto?" y la sesión responde "¿a qué cuenta se carga el gasto?".
 */
async function requireCarAccess(): Promise<void> {
  if (!(await hasCarAccess())) {
    throw new Error('Necesitás el token de acceso para modificar el mantenimiento')
  }
}

export async function getAbsoluteOdometerAction(): Promise<number | null> {
  return await carMaintenanceRepository.getAbsoluteOdometer()
}

export async function setAbsoluteOdometerAction(value: number) {
  await requireCarAccess()
  await carMaintenanceRepository.setAbsoluteOdometer(value)
  revalidatePath('/gasolina')
}

interface AddMaintenanceLogResult {
  transactionId: string | null
  /** El costo superó el saldo del fondo: el gasto se registró igual, pero avisamos. */
  warning?: string
}

/**
 * Registra un mantenimiento del auto. Si el conductor tiene configurado un fondo
 * de mantenimiento, el costo se descuenta de esa cuenta como gasto real, para
 * que el fondo refleje exactamente cuánto le queda al auto.
 *
 * `/gasolina` es una página pública: sin sesión no hay a quién atribuir el
 * gasto, así que en ese caso solo se guarda el log histórico. Esa degradación
 * se mantiene; lo que se añade por delante es el token de acceso al estado
 * compartido, porque sin él cualquiera podría escribir en el log global.
 */
export async function addMaintenanceLogAction(
  data: Omit<CarMaintenanceLog, 'id' | 'date' | 'transaction_id'>
): Promise<AddMaintenanceLogResult> {
  await requireCarAccess()

  const userId = await getUserId()
  const result: AddMaintenanceLogResult = { transactionId: null }

  if (!userId) {
    await carMaintenanceRepository.addMaintenanceLog({ ...data, transaction_id: null })
    return result
  }

  const config = await driverConfigRepository.findByUserId(userId)
  const fondoId = config?.maintenanceSavingsAccountId

  if (!config || !fondoId) {
    await carMaintenanceRepository.addMaintenanceLog({ ...data, transaction_id: null })
    return result
  }

  const fondo = await accountsRepository.findById(fondoId, userId)
  if (!fondo) {
    await carMaintenanceRepository.addMaintenanceLog({ ...data, transaction_id: null })
    return result
  }

  const transaction = await transactionService.createWithBalance({
    account_id: fondo.id,
    project_id: config.projectId,
    subtype: config.subtypeMapping.maintenance,
    type: 'EXPENSE',
    amount: data.cost,
    date: new Date().toISOString().slice(0, 10),
    description: `Mantenimiento: ${MAINTENANCE_TYPE_LABELS[data.type]}`,
  }, userId)

  try {
    await carMaintenanceRepository.addMaintenanceLog({
      ...data,
      transaction_id: transaction.id,
    })
  } catch (error) {
    // Sin log no hay trazabilidad del gasto: se revierte la transacción.
    await transactionService.deleteWithBalance(transaction.id, userId)
    throw error
  }

  result.transactionId = transaction.id

  if (data.cost > fondo.balance) {
    result.warning = `El fondo de mantenimiento quedó en negativo: ${data.cost.toFixed(2)} de costo con ${fondo.balance.toFixed(2)} disponibles.`
  }

  revalidatePath('/transacciones')
  return result
}

/**
 * Borra el registro de mantenimiento. Si tenía una transacción asociada
 * (descontada del fondo), primero se revierte para no dejar el gasto vivo
 * después de borrar el log.
 */
export async function deleteMaintenanceLogAction(id: string) {
  // Antes de leer: la lectura del log ya es trabajo que un tercero no debe
  // poder provocar, y el borrado va detrás.
  await requireCarAccess()

  const log = await carMaintenanceRepository.findById(id)
  const transactionId = log?.transaction_id

  if (transactionId) {
    const userId = await getUserId()
    if (!userId) throw new Error('Inicia sesión para revertir el gasto de este mantenimiento.')
    await transactionService.deleteWithBalance(transactionId, userId)
    revalidatePath('/transacciones')
  }

  await carMaintenanceRepository.deleteMaintenanceLog(id)
  revalidatePath('/gasolina')
}

export async function getMaintenanceLogsAction(type?: MaintenanceType): Promise<CarMaintenanceLog[]> {
  return await carMaintenanceRepository.getMaintenanceLogs(type)
}