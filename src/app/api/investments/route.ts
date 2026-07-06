import { NextRequest } from 'next/server'
import { investmentsService } from '@/services/investments.service'
import { createInvestmentSchema } from '@/lib/validations/investment.schema'
import { getUserId } from '@/lib/auth.server'

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const investments = await investmentsService.getAll(userId)
    return Response.json({ data: investments })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('GET /api/investments error:', error)
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = createInvestmentSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const investment = await investmentsService.create(parsed.data, userId)
    return Response.json({ data: investment }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    if (message === 'No autorizado' || message === 'Token inválido o expirado') {
      return Response.json({ error: message }, { status: 401 })
    }
    if (message.includes('Saldo insuficiente') || message.includes('no encontrada')) {
      return Response.json({ error: message }, { status: 422 })
    }
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
