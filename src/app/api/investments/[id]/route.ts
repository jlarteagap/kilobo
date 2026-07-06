import { NextRequest, NextResponse } from 'next/server'
import { investmentsService } from '@/services/investments.service'
import { updateInvestmentSchema } from '@/lib/validations/investment.schema'
import { getUserId } from '@/lib/auth.server'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const parsed = updateInvestmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const investment = await investmentsService.update(id, parsed.data, userId)
    return NextResponse.json({ data: investment })
  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    await investmentsService.delete(id, userId)
    return NextResponse.json({ success: true })
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
    'Cuenta no encontrada.': 404,
  }
  const status = statusMap[message] ?? 500
  return NextResponse.json({ error: message }, { status })
}
