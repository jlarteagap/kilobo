import { NextRequest } from 'next/server'
import { driverService } from '@/services/driver.service'
import { getUserId } from '@/lib/auth.server'
import { shiftSchema } from '@/lib/validations/driver.schema'
import type { ShiftInput } from '@/types/driver'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    await driverService.deleteShift(userId, id)
    return Response.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('DELETE /api/driver/shifts/[id] error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = shiftSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { id } = await params
    const shift = await driverService.updateShift(userId, id, parsed.data as ShiftInput)
    return Response.json({ data: shift })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('PATCH /api/driver/shifts/[id] error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
