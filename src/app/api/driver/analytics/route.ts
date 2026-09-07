import { driverService } from '@/services/driver.service'
import { getUserId } from '@/lib/auth.server'
import { monthQuerySchema } from '@/lib/validations/driver.schema'

export async function GET(req: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const rawYear = searchParams.get('year')
    const rawMonth = searchParams.get('month')

    // Sin params -> global (compatibilidad spec)
    if (rawYear == null && rawMonth == null) {
      const analytics = await driverService.getAnalytics(userId)
      return Response.json({ data: analytics })
    }

    const parsed = monthQuerySchema.safeParse({
      year: rawYear ?? undefined,
      month: rawMonth ?? undefined,
    })
    if (!parsed.success) {
      return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { year, month } = parsed.data
    if (year == null || month == null) {
      return Response.json({ error: 'Datos inválidos', details: { formErrors: ['year y month deben ir juntos'] } }, { status: 400 })
    }

    const analytics = await driverService.getAnalytics(userId, { year, month })
    return Response.json({ data: analytics })
  } catch (error: unknown) {
    console.error('GET /api/driver/analytics error:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
