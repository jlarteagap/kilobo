import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase.admin'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
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
      sameSite: 'lax',
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

