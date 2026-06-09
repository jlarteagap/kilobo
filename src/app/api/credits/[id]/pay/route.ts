import { NextRequest, NextResponse } from 'next/server'
import { payInstallmentsSchema } from '@/lib/validations/credit.schema'
import { getUserId } from '@/lib/auth.server'
import { creditsService } from '@/services/credits.service'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const parsed = payInstallmentsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    await creditsService.payInstallments(id, {
      installment_ids: parsed.data.installment_ids,
      amount:          parsed.data.amount,
      account_id:      parsed.data.account_id,
    }, userId)
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    const statusMap: Record<string, number> = {
      'Crédito no encontrado o no autorizado.': 404,
      'Cuenta no encontrada o no autorizada.': 404,
    }
    const status = statusMap[message] ?? 500
    return NextResponse.json({ error: message }, { status })
  }
}
