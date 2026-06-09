import { NextRequest, NextResponse } from 'next/server'
import { createCreditSchema } from '@/lib/validations/credit.schema'
import { getUserId } from '@/lib/auth.server'
import { creditsService } from '@/services/credits.service'

function handleError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Error interno del servidor'
  const statusMap: Record<string, number> = {
    'Cuenta no encontrada o no autorizada.': 404,
    'Crédito no encontrado o no autorizado.': 404,
    'El crédito ya está pagado.': 409,
    'No puedes eliminar un crédito activo. Cancélalo primero.': 409,
  }
  const status = statusMap[message] ?? 500
  return NextResponse.json({ error: message }, { status })
}

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const credits = await creditsService.getCredits(userId)
    return NextResponse.json({ data: credits })
  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = createCreditSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const credit = await creditsService.createCredit(parsed.data, userId)
    return NextResponse.json({ data: credit }, { status: 201 })
  } catch (error: unknown) {
    return handleError(error)
  }
}
