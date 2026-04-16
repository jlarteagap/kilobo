'use server'

import { revalidatePath } from 'next/cache'
import { carSharingRepository, CarTrip, CarSharingConfig } from '@/repositories/car-sharing.repository'

export async function addTripAction(data: { userName: string; initialKm: number; finalKm: number }) {
  await carSharingRepository.addTrip(data)
  revalidatePath('/car-sharing')
}

export async function deleteTripAction(id: string) {
  await carSharingRepository.deleteTrip(id)
  revalidatePath('/car-sharing')
}

export async function updateGasAmountAction(amount: number) {
  await carSharingRepository.updateGasAmount(amount)
  revalidatePath('/car-sharing')
}

export async function resetPeriodAction() {
  await carSharingRepository.resetPeriod()
  revalidatePath('/car-sharing')
}

export async function getTripsAction(): Promise<CarTrip[]> {
  return await carSharingRepository.getTrips()
}

export async function getConfigAction(): Promise<CarSharingConfig> {
  return await carSharingRepository.getConfig()
}
