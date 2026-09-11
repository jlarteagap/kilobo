import { NextRequest, NextResponse } from 'next/server'
import { investmentsService } from '@/services/investments.service'
import { getUserId } from '@/lib/auth.server'

type Params = { params: Promise<{ id: string; txId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id, txId } = await params
    await investmentsService.deleteTransaction(id, txId, userId)
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
    'Operación no encontrada.': 404,
    'No puedes eliminar': 422,
    'Saldo insuficiente': 422,
  }
  const matched = Object.entries(statusMap).find(([key]) => message.startsWith(key))
  const status = matched ? matched[1] : 500
  return NextResponse.json({ error: message }, { status })
}