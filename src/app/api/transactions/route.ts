import { NextRequest } from 'next/server'
import { transactionService } from '@/services/transactions.service'
import { createTransactionSchema } from '@/lib/validations/transaction.schema'

export async function GET(req: NextRequest) {
  try {
    const transactions = await transactionService.getTransactions()
    return Response.json(transactions)
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Token inválido o expirado') {
      return Response.json({ error: error.message }, { status: 401 })
    }
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const parsed = createTransactionSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const transaction = await transactionService.createTransaction(parsed.data)
    return Response.json(transaction, { status: 201 })
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Token inválido o expirado') {
      return Response.json({ error: error.message }, { status: 401 })
    }
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
