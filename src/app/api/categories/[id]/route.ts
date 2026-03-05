// app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { categoryService } from '@/services/category.service'
import { updateCategorySchema } from '@/lib/validations/category.schema'
import { getUserId } from '@/lib/auth.server'

type Params = { params: Promise<{ id: string }> }

// ─── PATCH — actualizar categoría (nombre, icon, color, tags) ─────────────────
export async function PATCH(
  req: NextRequest,
  { params }: Params
) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const body   = await req.json()

    const parsed = updateCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const category = await categoryService.updateCategory(id, parsed.data, userId)
    return NextResponse.json({ data: category })
  } catch (error: any) {
    return handleError(error)
  }
}

// ─── DELETE — eliminar categoría si no tiene transacciones ────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: Params
) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    await categoryService.deleteCategory(id, userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return handleError(error)
  }
}

// ─── Handler de errores centralizado ─────────────────────────────────────────
function handleError(error: any): NextResponse {
  const message = error?.message ?? 'Error interno del servidor'

  const statusMap: Record<string, number> = {
    'No autorizado':                      401,
    'Token inválido o expirado':          401,
    'Categoría no encontrada.':           404,
    'Categoría no encontrada o no autorizada.': 404,
    'No se puede eliminar una categoría que tiene transacciones asociadas.': 409,
  }

  // Tags en uso — mensaje dinámico, detectamos por prefijo
  if (message.startsWith('El tag "')) {
    return NextResponse.json({ error: message }, { status: 409 })
  }

  const status = statusMap[message] ?? 500
  return NextResponse.json({ error: message }, { status })
}