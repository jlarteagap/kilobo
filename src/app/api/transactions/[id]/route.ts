// app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { transactionService } from '@/services/transactions.service'
import { updateTransactionSchema } from '@/lib/validations/transaction.schema'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id }  = await params
    const body    = await req.json()

    const parsed = updateTransactionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const transaction = await transactionService.updateTransaction(id, parsed.data)
    return NextResponse.json({ data: transaction })  // ← estandarizado
  } catch (error: any) {
    return handleError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params
    await transactionService.deleteTransaction(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return handleError(error)
  }
}

function handleError(error: any): NextResponse {
  const message = error?.message ?? 'Error interno del servidor'
  const statusMap: Record<string, number> = {
    'No autorizado':                  401,
    'Token inválido o expirado':      401,
    'Transacción no encontrada.':     404,
  }
  const status = statusMap[message] ?? 500
  return NextResponse.json({ error: message }, { status })
}