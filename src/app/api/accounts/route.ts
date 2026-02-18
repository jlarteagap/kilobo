// src/app/api/accounts/route.ts
import { NextRequest } from 'next/server'
import { accountsService } from '@/services/accounts.service'
import { createAccountSchema } from '@/lib/validations/account.schema'

export async function GET(req: NextRequest) {
  try {
    const accounts = await accountsService.getAccounts()
    return Response.json(accounts)
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Token inválido o expirado') {
      return Response.json({ error: error.message }, { status: 401 })
    }
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const parsed = createAccountSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const account = await accountsService.createAccount(parsed.data)
    return Response.json(account, { status: 201 })
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Token inválido o expirado') {
      return Response.json({ error: error.message }, { status: 401 })
    }
    if (error.message.includes('límite')) {
      return Response.json({ error: error.message }, { status: 422 })
    }
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}