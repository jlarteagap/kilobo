// app/api/debts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { debtService } from '@/services/debt.service'
import { createDebtSchema } from '@/lib/validations/debt.schema'

export async function GET() {
  try {
    const debts = await debtService.getDebts()
    return NextResponse.json({ data: debts })
  } catch (error: any) {
    return handleError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = createDebtSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const debt = await debtService.createDebt(parsed.data)
    return NextResponse.json({ data: debt }, { status: 201 })
  } catch (error: any) {
    return handleError(error)
  }
}

function handleError(error: any): NextResponse {
  const message = error?.message ?? 'Error interno del servidor'
  const statusMap: Record<string, number> = {
    'Cuenta no encontrada.': 404,
    'Deuda no encontrada.':  404,
    'La deuda ya está pagada.': 409,
    'No puedes eliminar una deuda activa. Cancélala primero.': 409,
  }
  const status = statusMap[message] ?? 500
  return NextResponse.json({ error: message }, { status })
}