import { NextRequest, NextResponse } from 'next/server'
import { savingsGoalService } from '@/services/savings-goal.service'
import { updateSavingsGoalSchema } from '@/lib/validations/savings-goal.schema'
import { getUserId } from '@/lib/auth.server'
import { handleError } from '@/lib/api-utils'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const goal = await savingsGoalService.getGoal(id, userId)
    if (!goal) return NextResponse.json({ error: 'Meta no encontrada' }, { status: 404 })

    return NextResponse.json({ data: goal })
  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const parsed = updateSavingsGoalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const goal = await savingsGoalService.updateGoal(id, parsed.data, userId)
    return NextResponse.json({ data: goal })
  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    await savingsGoalService.deleteGoal(id, userId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return handleError(error)
  }
}
