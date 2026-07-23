import { NextRequest, NextResponse } from 'next/server'
import { investmentsService } from '@/services/investments.service'
import { buyInvestmentSchema, sellInvestmentSchema } from '@/lib/validations/investment.schema'
import { getUserId } from '@/lib/auth.server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const transactions = await investmentsService.getTransactions(id, userId)
    return NextResponse.json({ data: transactions })
  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id: investment_id } = await params
    const body = await req.json()

    const schema = body.type === 'SELL' ? sellInvestmentSchema : buyInvestmentSchema
    const parsed = schema.safeParse({ ...body, investment_id })
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    if (body.type === 'SELL') {
      await investmentsService.sell(parsed.data, userId)
    } else {
      await investmentsService.buy(parsed.data, userId)
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: unknown) {
    return handleError(error)
  }
}

function handleError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Error interno del servidor'
  const statusMap: Record<string, number> = {
    'No autorizado': 401,
    'Token inválido o expirado': 401,
    'Inversión no encontrada.': 404,
    'Inversión no encontrada': 404,
    'Cuenta no encontrada.': 404,
    'Saldo insuficiente': 422,
  }
  const matched = Object.entries(statusMap).find(([key]) => message.startsWith(key))
  const status = matched ? matched[1] : 500
  return NextResponse.json({ error: message }, { status })
}
