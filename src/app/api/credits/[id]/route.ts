import { NextRequest, NextResponse } from 'next/server'
import { payInstallmentsSchema } from '@/lib/validations/credit.schema'
import { getUserId } from '@/lib/auth.server'
import { creditsService } from '@/services/credits.service'

type Params = { params: Promise<{ id: string }> }

function handleError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Error interno del servidor'
  const statusMap: Record<string, number> = {
    'Crédito no encontrado o no autorizado.': 404,
    'Cuenta no encontrada o no autorizada.': 404,
    'El crédito ya está pagado.': 409,
    'No puedes eliminar un crédito activo. Cancélalo primero.': 409,
  }
  const status = statusMap[message] ?? 500
  return NextResponse.json({ error: message }, { status })
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const detail = await creditsService.getCreditDetail(id, userId)
    return NextResponse.json({ data: detail })
  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const credit = await creditsService.cancelCredit(id, userId)
    return NextResponse.json({ data: credit })
  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    await creditsService.deleteCredit(id, userId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return handleError(error)
  }
}
