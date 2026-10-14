import { NextRequest, NextResponse } from 'next/server'
import { grantCarAccess, revokeCarAccess } from '@/lib/car-access'
import { assertSameOrigin } from '@/lib/api-utils'
import { clientIp, guardedRateLimit } from '@/lib/rate-limit'

/**
 * Entrega del token de escritura del estado compartido de /gasolina.
 *
 * La LECTURA de /gasolina es pública por diseño (design.md D1); esta ruta solo
 * controla si quien está en la página puede modificar el ciclo compartido.
 */
const LIMIT = { max: 5, windowSec: 300 } as const

export async function POST(req: NextRequest) {
  const originError = assertSameOrigin(req)
  if (originError) return originError

  try {
    const rate = await guardedRateLimit('car-access', clientIp(req), LIMIT)
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Demasiados intentos' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
      )
    }

    const { token } = await req.json().catch(() => ({}))
    if (typeof token !== 'string' || !token.trim()) {
      return NextResponse.json({ error: 'Falta el token' }, { status: 400 })
    }

    const granted = await grantCarAccess(token.trim())
    if (!granted) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: unknown) {
    console.error('[POST /api/car-access]', error)
    return NextResponse.json({ error: 'Error al validar el token' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const originError = assertSameOrigin(req)
  if (originError) return originError

  await revokeCarAccess()
  return NextResponse.json({ success: true }, { status: 200 })
}