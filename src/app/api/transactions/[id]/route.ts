// app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { transactionService } from '@/services/transactions.service'
import { updateTransactionSchema } from '@/lib/validations/transaction.schema'
import { getUserId } from '@/lib/auth.server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(
  req: NextRequest,
  { params }: Params
) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id }  = await params
    const body    = await req.json()

    const parsed = updateTransactionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const transaction = await transactionService.updateTransaction(id, parsed.data, userId)
    return NextResponse.json({ data: transaction })  // ← estandarizado
  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: Params
) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    await transactionService.deleteTransaction(id, userId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return handleError(error)
  }
}

function handleError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Error interno del servidor'
  const statusMap: Record<string, number> = {
    'No autorizado':                  401,
    'Transacción no encontrada o no autorizada.': 404,
    'Token inválido o expirado':      401,
    'Transacción no encontrada.':     404,
  }
  const status = statusMap[message] ?? 500
  return NextResponse.json({ error: message }, { status })
}