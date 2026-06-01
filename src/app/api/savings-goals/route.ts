import { NextRequest, NextResponse } from 'next/server'
import { savingsGoalService } from '@/services/savings-goal.service'
import { createSavingsGoalSchema } from '@/lib/validations/savings-goal.schema'
import { getUserId } from '@/lib/auth.server'
import { handleError } from '@/lib/api-utils'

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const goals = await savingsGoalService.getGoals(userId)
    return NextResponse.json({ data: goals })
  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = createSavingsGoalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const goal = await savingsGoalService.createGoal({
      ...parsed.data,
      deadline: parsed.data.deadline ?? null,
    }, userId)
    return NextResponse.json({ data: goal }, { status: 201 })
  } catch (error: unknown) {
    return handleError(error, { 'limite': 422 })
  }
}
