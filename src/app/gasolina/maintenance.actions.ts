'use server'

import { revalidatePath } from 'next/cache'
import { carMaintenanceRepository, CarMaintenanceLog, MaintenanceType } from '@/repositories/car-maintenance.repository'

export async function getAbsoluteOdometerAction(): Promise<number | null> {
  return await carMaintenanceRepository.getAbsoluteOdometer()
}

export async function setAbsoluteOdometerAction(value: number) {
  await carMaintenanceRepository.setAbsoluteOdometer(value)
  revalidatePath('/gasolina')
}

export async function addMaintenanceLogAction(data: Omit<CarMaintenanceLog, 'id' | 'date'>) {
  await carMaintenanceRepository.addMaintenanceLog(data)
  revalidatePath('/gasolina')
}

export async function deleteMaintenanceLogAction(id: string) {
  await carMaintenanceRepository.deleteMaintenanceLog(id)
  revalidatePath('/gasolina')
}

export async function getMaintenanceLogsAction(type?: MaintenanceType): Promise<CarMaintenanceLog[]> {
  return await carMaintenanceRepository.getMaintenanceLogs(type)
}
