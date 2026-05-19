// app/api/budgets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { budgetService } from '@/services/budget.service'
import { updateBudgetSchema } from '@/lib/validations/budget.schema'
import { getUserId } from '@/lib/auth.server'

type Params = { params: Promise<{ id: string }> }

// ── Actualizar ────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const body   = await req.json()

    const parsed = updateBudgetSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const budget = await budgetService.updateBudget(id, parsed.data, userId)
    return NextResponse.json({ data: budget })
  } catch (error: unknown) {
    return handleError(error)
  }
}

// ── Archivar ──────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const budget = await budgetService.archiveBudget(id, userId)
    return NextResponse.json({ data: budget })
  } catch (error: unknown) {
    return handleError(error)
  }
}

// ── Eliminar ──────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    await budgetService.deleteBudget(id, userId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return handleError(error)
  }
}

function handleError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Error interno del servidor'
  const statusMap: Record<string, number> = {
    'Selecciona al menos una categoría.':                400,
    'Los gastos fijos requieren un día de vencimiento.': 400,
    'No autorizado':                                     401,
    'Presupuesto no encontrado.':                        404,
    'El presupuesto ya está archivado.':                 409,
    'Archiva el presupuesto antes de eliminarlo.':       409,
  }
  const status = statusMap[message] ?? 500
  return NextResponse.json({ error: message }, { status })
}