import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth.server'
import { assertSameOrigin } from '@/lib/api-utils'
import { deleteAccount } from '@/lib/user-account'
import { guardedRateLimit } from '@/lib/rate-limit'

/**
 * Supresión de cuenta. Irreversible, por eso lleva límite estricto y exige
 * confirmación explícita en el cuerpo.
 */
const LIMIT = { max: 3, windowSec: 3600 } as const

export async function POST(req: NextRequest) {
  const originError = assertSameOrigin(req)
  if (originError) return originError

  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    if (body?.confirm !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        { error: 'Falta la confirmación explícita' },
        { status: 400 },
      )
    }

    const rate = await guardedRateLimit('account-delete', userId, LIMIT)
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Demasiados intentos de eliminación' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
      )
    }

    const report = await deleteAccount(userId)
    const failed = report.filter((r) => !r.ok)

    if (failed.length > 0) {
      // Parcial: se informa con precisión en lugar de aparentar un borrado total.
      return NextResponse.json(
        {
          error: 'La eliminación fue parcial',
          failed: failed.map((f) => f.collection),
          report,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      deleted: report.reduce((acc, r) => acc + r.deleted, 0),
    })
  } catch (error: unknown) {
    console.error('[DELETE /api/user/account]', error)
    return NextResponse.json({ error: 'Error al eliminar la cuenta' }, { status: 500 })
  }
}