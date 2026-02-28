// app/api/budgets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { budgetService } from '@/services/budget.service'
import { createBudgetSchemaWithRefinement } from '@/lib/validations/budget.schema'

export async function GET() {
  try {
    const budgets = await budgetService.getBudgets()
    return NextResponse.json({ data: budgets })
  } catch (error: any) {
    return handleError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = createBudgetSchemaWithRefinement.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const budget = await budgetService.createBudget(parsed.data)
    return NextResponse.json({ data: budget }, { status: 201 })
  } catch (error: any) {
    return handleError(error)
  }
}

function handleError(error: any): NextResponse {
  const message = error?.message ?? 'Error interno del servidor'
  const statusMap: Record<string, number> = {
    'Selecciona al menos una categoría.':              400,
    'Los gastos fijos requieren un día de vencimiento.': 400,
    'Presupuesto no encontrado.':                      404,
    'El presupuesto ya está archivado.':               409,
    'Archiva el presupuesto antes de eliminarlo.':     409,
  }
  const status = statusMap[message] ?? 500
  return NextResponse.json({ error: message }, { status })
}