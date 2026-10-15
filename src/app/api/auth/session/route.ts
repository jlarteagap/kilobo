import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase.admin'
import { cookies } from 'next/headers'
import { clientIp, guardedRateLimit } from '@/lib/rate-limit'

/**
 * El endpoint más expuesto de la aplicación: no requiere sesión y cada llamada
 * dispara un round-trip al Admin SDK de Firebase. Se limita por IP con el
 * umbral más estricto de los tres.
 */
const LIMIT = { max: 10, windowSec: 60 } as const

export async function POST(req: NextRequest) {
  try {
    const rate = await guardedRateLimit('auth-session', clientIp(req.headers), LIMIT)
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes de inicio de sesión' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
      )
    }

    const { idToken } = await req.json()
    if (!idToken) {
      return NextResponse.json({ error: 'Falta el idToken' }, { status: 400 })
    }

    const expiresIn = 60 * 60 * 24 * 7 * 1000 // 7 days in milliseconds
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })

    const cookieStore = await cookies()
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: unknown) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Error al crear la sesión' }, { status: 401 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar la sesión' }, { status: 500 })
  }
}

