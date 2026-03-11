// src/app/api/accounts/route.ts
import { NextRequest } from 'next/server'
import { accountsService } from '@/services/accounts.service'
import { createAccountSchema } from '@/lib/validations/account.schema'
import { getUserId } from '@/lib/auth.server'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })
      console.log('userId', userId)

    const accounts = await accountsService.getAccounts(userId)
    return Response.json(accounts)
  } catch (error: any) {
    console.error('GET /api/accounts error:', error)
    if (error.message === 'No autorizado' || error.message === 'Token inválido o expirado') {
      return Response.json({ error: error.message }, { status: 401 })
    }
    return Response.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()

    const parsed = createAccountSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const account = await accountsService.createAccount(parsed.data, userId)
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