'use server'

import { driverService } from '@/services/driver.service'
import { getUserId } from '@/lib/auth.server'
import { revalidatePath } from 'next/cache'
import { shiftGapSummary, type ShiftInput } from '@/types/driver'

export async function createShiftAction(data: ShiftInput) {
  const userId = await getUserId()
  if (!userId) return { error: 'No autorizado' }

  try {
    const { shift, gasolinaSynced } = await driverService.createShift(userId, data)
    revalidatePath('/conductor')
    revalidatePath('/conductor/analytics')
    revalidatePath('/gasolina')
    return { success: true, gap: shiftGapSummary(shift), gasolinaSynced }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al registrar turno' }
  }
}
