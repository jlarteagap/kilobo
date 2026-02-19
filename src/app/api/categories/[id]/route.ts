import { NextRequest } from 'next/server'
import { categoryService } from '@/services/category.service'
import { updateCategorySchema } from '@/lib/validations/category.schema'

type Params = { params: Promise<{ id: string }> }

export async function PUT(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params  // 👈 await aquí
    const body = await req.json()

    const parsed = updateCategorySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const category = await categoryService.updateCategory(id, parsed.data)
    return Response.json(category)
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Token inválido o expirado') {
      return Response.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Categoría no encontrada.') {
      return Response.json({ error: error.message }, { status: 404 })
    }
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params  // 👈 await aquí
    await categoryService.deleteCategory(id)
    return Response.json({ success: true })
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Token inválido o expirado') {
      return Response.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Categoría no encontrada.') {
      return Response.json({ error: error.message }, { status: 404 })
    }
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
