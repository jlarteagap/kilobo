// app/api/insights/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { insightsService }           from '@/services/insights.service'
import { getUserId } from '@/lib/auth.server'

// ─── GET /api/insights ────────────────────────────────────────────────────────
// Retorna insights desde caché o genera uno nuevo

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const months = Math.min(
      parseInt(searchParams.get('months') ?? '3', 10),
      6,    // máximo 6 meses para limitar tokens enviados a la IA
    )

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
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body   = await req.json().catch(() => ({}))
    const months = Math.min(body.months ?? 3, 6)

    const result = await insightsService.refreshInsights(userId, months)

    return NextResponse.json({ data: result }, { status: 200 })

  } catch (err) {
    console.error('[POST /api/insights]', err)
    return NextResponse.json(
      { error: 'Failed to refresh insights' },
      { status: 500 },
    )
  }
}