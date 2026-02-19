import { NextRequest } from 'next/server'
import { transactionService } from '@/services/transactions.service'
import { updateTransactionSchema } from '@/lib/validations/transaction.schema'

type Params = { params: Promise<{ id: string }> }

export async function PUT(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params  // 👈 await aquí
    const body = await req.json()

    const parsed = updateTransactionSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const transaction = await transactionService.updateTransaction(id, parsed.data)
    return Response.json(transaction)
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Token inválido o expirado') {
      return Response.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Transacción no encontrada.') {
      return Response.json({ error: error.message }, { status: 404 })
    }
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params  // 👈 await aquí
    await transactionService.deleteTransaction(id)
    return Response.json({ success: true })
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Token inválido o expirado') {
      return Response.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Transacción no encontrada.') {
      return Response.json({ error: error.message }, { status: 404 })
    }
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
