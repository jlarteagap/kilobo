import { driverDepositService } from '@/services/driver-deposit.service'
import { getUserId } from '@/lib/auth.server'
import { depositSchema, monthQuerySchema } from '@/lib/validations/driver.schema'
import type { DepositInput } from '@/types/driver'

// GET /api/driver/deposits?year=YYYY&month=M → lista de depósitos del mes
// Sin params → mes actual (evita sobrecarga)
export async function GET(req: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const rawYear = searchParams.get('year')
    const rawMonth = searchParams.get('month')

    if (rawYear == null && rawMonth == null) {
      const now = new Date()
      const deposits = await driverDepositService.getDeposits(userId, { year: now.getFullYear(), month: now.getMonth() + 1 })
      return Response.json({ data: deposits })
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

    const deposits = await driverDepositService.getDeposits(userId, { year, month })
    return Response.json({ data: deposits })
  } catch (error: unknown) {
    console.error('GET /api/driver/deposits error:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/driver/deposits → crea un depósito (neto = bruto − comisión)
export async function POST(req: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = depositSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const deposit = await driverDepositService.createDeposit(userId, parsed.data as DepositInput)
    return Response.json({ data: deposit })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('POST /api/driver/deposits error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}