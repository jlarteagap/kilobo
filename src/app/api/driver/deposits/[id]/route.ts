import { NextRequest } from 'next/server'
import { driverDepositService } from '@/services/driver-deposit.service'
import { getUserId } from '@/lib/auth.server'
import { depositSchema } from '@/lib/validations/driver.schema'
import type { DepositInput } from '@/types/driver'

// PATCH /api/driver/deposits/[id] → actualiza un depósito
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = depositSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { id } = await params
    const deposit = await driverDepositService.updateDeposit(userId, id, parsed.data as DepositInput)
    return Response.json({ data: deposit })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('PATCH /api/driver/deposits/[id] error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/driver/deposits/[id] → elimina un depósito
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    await driverDepositService.deleteDeposit(userId, id)
    return Response.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('DELETE /api/driver/deposits/[id] error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}