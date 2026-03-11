import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value

  // Rutas públicas en las que no necesitamos que el usuario esté autenticado
  // (incluyendo _next para los assets y api para el login/session route)
  const isAuthRoute =
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/register' ||
    request.nextUrl.pathname === '/'

  // Si no hay sesión y el usuario intenta acceder a una ruta privada -> a /login
  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si YA hay sesión y el usuario intenta volver a entrar al login -> a /dashboard
  if (session && isAuthRoute) {
    // Evitar loop en la raíz o en los links de login
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Se aplican las reglas a todas las rutas EXCEPTO:
    // - _next/static (archivos estáticos de next)
    // - _next/image (optimización de imágenes)
    // - favicon.ico (icono)
    // - /api/auth (rutas de autenticación de next.js)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
