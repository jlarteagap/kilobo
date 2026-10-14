// app/api/insights/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { insightsService }           from '@/services/insights.service'
import { getUserId } from '@/lib/auth.server'
import { assertSameOrigin } from '@/lib/api-utils'
import { guardedRateLimit } from '@/lib/rate-limit'

/** Umbral por usuario: un refresh manual cada 30 s de media es holgado. */
const INSIGHTS_REFRESH_LIMIT = { max: 5, windowSec: 60 } as const

/**
 * Acota el periodo a un rango válido de meses. `parseInt` neutraliza entradas
 * no numéricas como "abc" (que antes producían NaN) y el clamp impide tanto 0
 * como valores desproporcionados que acabarían en el id del documento de caché.
 */
function clampMonths(value: unknown): number {
  const n = parseInt(String(value ?? 3), 10)
  return Math.min(Math.max(Number.isFinite(n) && n > 0 ? n : 3, 1), 6)
}

// ─── GET /api/insights ────────────────────────────────────────────────────────
// Retorna insights desde caché o genera uno nuevo

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const months = clampMonths(searchParams.get('months') ?? 3)

    const result = await insightsService.getInsights(userId, months)

    return NextResponse.json({ data: result }, { status: 200 })

  } catch (err) {
    console.error('[GET /api/insights]', err)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 },
    )
  }
}

// ─── POST /api/insights/refresh ───────────────────────────────────────────────
// Fuerza regeneración ignorando el caché

export async function POST(req: NextRequest) {
  const originError = assertSameOrigin(req)
  if (originError) return originError

  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // El refresh descarta la caché de 24 h y relee el historial para recalcular.
    // Sin límite, es el bucle más barato de amplificar lecturas.
    const rate = await guardedRateLimit('insights-refresh', userId, INSIGHTS_REFRESH_LIMIT)
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Demasiados refrescos seguidos' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
      )
    }

    const body   = await req.json().catch(() => ({}))
    const months = clampMonths(body?.months)

    console.log('[POST /api/insights] Refreshing insights for user', userId.slice(0, 8) + '...')
    const result = await insightsService.refreshInsights(userId, months)
    console.log('[POST /api/insights] Done')

    return NextResponse.json({ data: result }, { status: 200 })

  } catch (err) {
    console.error('[POST /api/insights]', err)
    return NextResponse.json(
      { error: 'Failed to refresh insights' },
      { status: 500 },
    )
  }
}