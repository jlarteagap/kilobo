'use server'

import { revalidatePath } from 'next/cache'
import { carSharingRepository } from '@/repositories/car-sharing.repository'
import type { CarCycle } from '@/types/car-sharing'

export async function addTripAction(data: { userName: string; initialKm: number; finalKm: number; clientTimestamp?: number }) {
  await carSharingRepository.addTrip(data)
  revalidatePath('/gasolina')
}

export async function deleteTripAction(createdAt: number) {
  await carSharingRepository.deleteTrip(createdAt)
  revalidatePath('/gasolina')
}

export async function updateTripAction(createdAt: number, data: { userName: string, finalKm: number }) {
  await carSharingRepository.updateTrip(createdAt, data)
  revalidatePath('/gasolina')
}

export async function closeCycleAction(
  gasAmount: number,
  paidBy: string,
  gasLiters?: number | null,
) {
  if (!Number.isFinite(gasAmount) || gasAmount <= 0) {
    throw new Error('El monto de la carga debe ser mayor a cero')
  }
  if (!paidBy) {
    throw new Error('Debes indicar quien pago la carga')
  }
  if (gasLiters !== undefined && gasLiters !== null) {
    if (!Number.isFinite(gasLiters) || gasLiters <= 0) {
      throw new Error('Los litros deben ser mayores a cero, o dejar el campo vacio')
    }
  }

  await carSharingRepository.closeActiveCycle(gasAmount, paidBy, gasLiters)
  revalidatePath('/gasolina')
}

export async function setCycleSettledAction(id: string, settled: boolean) {
  await carSharingRepository.setCycleSettled(id, settled)
  revalidatePath('/gasolina')
}

/**
 * Edita un ciclo cerrado. Se usa sobre todo para completar `gasLiters` en los
 * ciclos anteriores a la feature, y para corregir el monto sin perder los
 * viajes del ciclo.
 */
export async function updateClosedCycleAction(
  id: string,
  data: { gasAmount: number; gasLiters?: number | null; paidBy: string },
) {
  if (!id) {
    throw new Error('Falta el identificador del ciclo')
  }
  if (!Number.isFinite(data.gasAmount) || data.gasAmount <= 0) {
    throw new Error('El monto de la carga debe ser mayor a cero')
  }
  if (!data.paidBy) {
    throw new Error('Debes indicar quien pago la carga')
  }
  if (data.gasLiters !== undefined && data.gasLiters !== null) {
    if (!Number.isFinite(data.gasLiters) || data.gasLiters <= 0) {
      throw new Error('Los litros deben ser mayores a cero, o dejar el campo vacio')
    }
  }

  await carSharingRepository.updateClosedCycle(id, data)
  revalidatePath('/gasolina')
}

export async function deleteCycleAction(id: string) {
  await carSharingRepository.deleteCycle(id)
  revalidatePath('/gasolina')
}

export async function resetAllAction() {
  await carSharingRepository.resetAll()
  revalidatePath('/gasolina')
}

export async function getActiveCycleAction(): Promise<CarCycle> {
  return await carSharingRepository.getActiveCycle()
}

export async function getClosedCyclesAction(): Promise<CarCycle[]> {
  return await carSharingRepository.getClosedCycles()
}
