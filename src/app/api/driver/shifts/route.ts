import { driverService } from '@/services/driver.service'
import { getUserId } from '@/lib/auth.server'
import { shiftSchema } from '@/lib/validations/driver.schema'
import type { ShiftInput } from '@/types/driver'

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const shifts = await driverService.getShifts(userId)
    return Response.json({ data: shifts })
  } catch (error: unknown) {
    console.error('GET /api/driver/shifts error:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = shiftSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const shift = await driverService.createShift(userId, parsed.data as ShiftInput)
    return Response.json({ data: shift })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('POST /api/driver/shifts error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
