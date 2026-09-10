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

    // Límite del periodo diario (4:00 AM local) calculado en el cliente.
    // Devuelve la ancla: el último cambio antes de ese instante.
    const beforeParam = req.nextUrl.searchParams.get('before')
    const before = beforeParam ? new Date(beforeParam) : new Date()
    if (Number.isNaN(before.getTime())) {
      return Response.json({ error: 'El parámetro before es inválido' }, { status: 400 })
    }

    const change = await accountBalanceHistoryRepository.findLastBefore(accountId, userId, before)
    return Response.json({ change })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    if (message === 'No autorizado' || message === 'Token inválido o expirado') {
      return Response.json({ error: message }, { status: 401 })
    }
    console.error('[account-balance-changes] Error:', message)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}