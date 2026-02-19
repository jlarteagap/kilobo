// src/app/api/accounts/[id]/route.ts
import { NextRequest } from 'next/server'
import { accountsService } from '@/services/accounts.service'
import { updateAccountSchema } from '@/lib/validations/account.schema'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params  // 👈 await aquí
    const body = await req.json()

    const parsed = updateAccountSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const account = await accountsService.updateAccount(id, parsed.data)
    return Response.json(account)
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Token inválido o expirado') {
      return Response.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Cuenta no encontrada.') {
      return Response.json({ error: error.message }, { status: 404 })
    }
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params  // 👈 await aquí
    await accountsService.deleteAccount(id)
    return new Response(null, { status: 204 })
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Token inválido o expirado') {
      return Response.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Cuenta no encontrada.') {
      return Response.json({ error: error.message }, { status: 404 })
    }
    if (error.message.includes('balance')) {
      return Response.json({ error: error.message }, { status: 422 })
    }
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}