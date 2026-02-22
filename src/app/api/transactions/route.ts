// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { transactionService } from '@/services/transactions.service'
import { createTransactionSchema } from '@/lib/validations/transaction.schema'

export async function GET(req: NextRequest) {
  try {
    const transactions = await transactionService.getTransactions()
    return NextResponse.json({ data: transactions ?? [] })  // ← estandarizado
  } catch (error: any) {
    return handleError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = createTransactionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const transaction = await transactionService.createTransaction(parsed.data)
    return NextResponse.json({ data: transaction }, { status: 201 })  // ← estandarizado
  } catch (error: any) {
    return handleError(error)
  }
}

function handleError(error: any): NextResponse {
  const message = error?.message ?? 'Error interno del servidor'
  const statusMap: Record<string, number> = {
    'No autorizado':             401,
    'Token inválido o expirado': 401,
  }
  const status = statusMap[message] ?? 500
  return NextResponse.json({ error: message }, { status })
}