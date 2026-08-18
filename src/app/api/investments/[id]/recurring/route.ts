import { NextRequest, NextResponse } from 'next/server'
import { investmentsService } from '@/services/investments.service'
import { recurringBuySchema } from '@/lib/validations/investment.schema'
import { getUserId } from '@/lib/auth.server'
import { handleError } from '@/lib/api-utils'

type Params = { params: Promise<{ id: string }> }

const statusMap: Record<string, number> = {
  'Inversión no encontrada.': 404,
  'Inversión no encontrada': 404,
  'La inversión necesita tener unidades': 422,
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const parsed = recurringBuySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    await investmentsService.saveRecurring(id, parsed.data, userId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return handleError(error, statusMap)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    await investmentsService.deleteRecurring(id, userId)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return handleError(error, statusMap)
  }
}
