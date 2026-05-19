// app/api/budgets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { budgetService } from '@/services/budget.service'
import { createBudgetSchemaWithRefinement } from '@/lib/validations/budget.schema'
import { getUserId } from '@/lib/auth.server'

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const budgets = await budgetService.getBudgets(userId)
    return NextResponse.json({ data: budgets })
  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body   = await req.json()
    const parsed = createBudgetSchemaWithRefinement.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const budget = await budgetService.createBudget(parsed.data, userId)
    return NextResponse.json({ data: budget }, { status: 201 })
  } catch (error: unknown) {
    return handleError(error)
  }
}

function handleError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Error interno del servidor'
  const statusMap: Record<string, number> = {
    'Selecciona al menos una categoría.':              400,
    'Los gastos fijos requieren un día de vencimiento.': 400,
    'No autorizado':                                   401,
    'Presupuesto no encontrado.':                      404,
    'El presupuesto ya está archivado.':               409,
    'Archiva el presupuesto antes de eliminarlo.':     409,
  }
  const status = statusMap[message] ?? 500
  return NextResponse.json({ error: message }, { status })
}