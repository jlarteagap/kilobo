'use server'

import { revalidatePath } from 'next/cache'
import { carSharingRepository, CarCycle } from '@/repositories/car-sharing.repository'

export async function addTripAction(data: { userName: string; initialKm: number; finalKm: number }) {
  await carSharingRepository.addTrip(data)
  revalidatePath('/car-sharing')
}

export async function deleteTripAction(createdAt: number) {
  await carSharingRepository.deleteTrip(createdAt)
  revalidatePath('/car-sharing')
}

export async function closeCycleAction(gasAmount: number, paidBy: string) {
  await carSharingRepository.closeActiveCycle(gasAmount, paidBy)
  revalidatePath('/car-sharing')
}

export async function deleteCycleAction(id: string) {
  await carSharingRepository.deleteCycle(id)
  revalidatePath('/car-sharing')
}

export async function resetAllAction() {
  await carSharingRepository.resetAll()
  revalidatePath('/car-sharing')
}

export async function getActiveCycleAction(): Promise<CarCycle> {
  return await carSharingRepository.getActiveCycle()
}

export async function getClosedCyclesAction(): Promise<CarCycle[]> {
  return await carSharingRepository.getClosedCycles()
}
