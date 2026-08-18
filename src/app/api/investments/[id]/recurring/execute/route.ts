import { NextRequest, NextResponse } from 'next/server'
import { investmentsService } from '@/services/investments.service'
import { executeRecurringBuySchema } from '@/lib/validations/investment.schema'
import { getUserId } from '@/lib/auth.server'
import { handleError } from '@/lib/api-utils'

type Params = { params: Promise<{ id: string }> }

const statusMap: Record<string, number> = {
  'Inversión no encontrada.': 404,
  'Inversión no encontrada': 404,
  'Saldo insuficiente': 422,
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const parsed = executeRecurringBuySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    await investmentsService.executeRecurringBuy(id, parsed.data, userId)
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: unknown) {
    return handleError(error, statusMap)
  }
}
