import { driverService } from '@/services/driver.service'
import { getUserId } from '@/lib/auth.server'
import { shiftSchema, monthQuerySchema } from '@/lib/validations/driver.schema'
import type { ShiftInput } from '@/types/driver'

export async function GET(req: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const rawYear = searchParams.get('year')
    const rawMonth = searchParams.get('month')

    // Sin params -> default mes actual (evita sobrecarga)
    if (rawYear == null && rawMonth == null) {
      const now = new Date()
      const shifts = await driverService.getShifts(userId, { year: now.getFullYear(), month: now.getMonth() + 1 })
      return Response.json({ data: shifts })
    }

    const parsed = monthQuerySchema.safeParse({
      year: rawYear ?? undefined,
      month: rawMonth ?? undefined,
    })
    if (!parsed.success) {
      return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { year, month } = parsed.data
    // monthQuerySchema garantiza que van juntos, pero si ambos undefined ya retornamos arriba
    if (year == null || month == null) {
      return Response.json({ error: 'Datos inválidos', details: { formErrors: ['year y month deben ir juntos'] } }, { status: 400 })
    }

    const shifts = await driverService.getShifts(userId, { year, month })
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
