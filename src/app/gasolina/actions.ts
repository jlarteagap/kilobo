'use server'

import { revalidatePath } from 'next/cache'
import { carSharingRepository, CarCycle } from '@/repositories/car-sharing.repository'

export async function addTripAction(data: { userName: string; initialKm: number; finalKm: number }) {
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

export async function closeCycleAction(gasAmount: number, paidBy: string) {
  await carSharingRepository.closeActiveCycle(gasAmount, paidBy)
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
