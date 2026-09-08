// src/app/api/account-balance-changes/route.ts
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/auth.server'
import { accountBalanceHistoryRepository } from '@/repositories/account-balance-history.repository'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const accountId = req.nextUrl.searchParams.get('account_id')
    if (!accountId) {
      return Response.json({ error: 'Falta el parámetro account_id' }, { status: 400 })
    }

    const change = await accountBalanceHistoryRepository.findLatestByAccount(accountId, userId)
    return Response.json({ change })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    if (message === 'No autorizado' || message === 'Token inválido o expirado') {
      return Response.json({ error: message }, { status: 401 })
    }
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}