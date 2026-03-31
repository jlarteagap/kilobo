// app/api/debts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { debtService } from '@/services/debt.service'
import { createDebtPaymentSchema } from '@/lib/validations/debt.schema'
import { getUserId } from '@/lib/auth.server'

type Params = { params: Promise<{ id: string }> }

// Registrar pago
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id }  = await params
    const body    = await req.json()
    const parsed  = createDebtPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const payment = await debtService.registerPayment(id, parsed.data, userId)
    return NextResponse.json({ data: payment }, { status: 201 })
  } catch (error: unknown) {
    return handleError(error)
  }
}

// Cancelar deuda
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const debt   = await debtService.cancelDebt(id, userId)
    return NextResponse.json({ data: debt })
  } catch (error: unknown) {
    return handleError(error)
  }
}

// Eliminar deuda
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    await debtService.deleteDebt(id, userId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return handleError(error)
  }
}

function handleError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Error interno del servidor'
  const statusMap: Record<string, number> = {
    'Cuenta no encontrada.':   404,
    'Deuda no encontrada.':    404,
    'Cuenta no encontrada o no autorizada.': 404,
    'Deuda no encontrada o no autorizada.':  404,
    'La deuda ya está pagada.': 409,
    'No puedes eliminar una deuda activa. Cancélala primero.': 409,
  }
  const status = statusMap[message] ?? 500
  return NextResponse.json({ error: message }, { status })
}