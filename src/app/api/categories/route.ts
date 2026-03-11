import { NextRequest,NextResponse } from 'next/server'
import { categoryService } from '@/services/category.service'
import { createCategorySchema } from '@/lib/validations/category.schema'
import { getUserId } from '@/lib/auth.server'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const categories = await categoryService.getCategories(userId)
    return NextResponse.json({ data: categories ?? [] })
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Token inválido o expirado') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()

    const parsed = createCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Adapt schema output to match CreateCategoryData type (handling optional fields if needed)
    // The schema allows null/optional for parent_id and icon.
    // The service expects CreateCategoryData which matches Type Category (mostly).
    // Let's assume automatic compatibility or simple spread.
    const category = await categoryService.createCategory(parsed.data, userId)
    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Token inválido o expirado') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
