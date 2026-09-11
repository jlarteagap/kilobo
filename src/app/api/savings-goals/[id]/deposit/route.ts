import { NextRequest, NextResponse } from 'next/server'
import { savingsGoalService } from '@/services/savings-goal.service'
import { depositSavingsGoalSchema } from '@/lib/validations/savings-goal.schema'
import { getUserId } from '@/lib/auth.server'
import { handleError } from '@/lib/api-utils'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const parsed = depositSavingsGoalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const result = await savingsGoalService.deposit(id, parsed.data, userId)
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error: unknown) {
    return handleError(error, {
      'El depósito supera': 422,
      'No puedes depositar': 422,
      'Meta no encontrada o no autorizada.': 404,
      'Cuenta no encontrada.': 404,
    })
  }
}