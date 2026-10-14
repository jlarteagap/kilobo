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

  // features públicas que no requieren auth y tampoco te sacan si estas logueado
  const isPublicFeature = request.nextUrl.pathname.startsWith('/gasolina') || request.nextUrl.pathname.startsWith('/car-sharing')

  // Documentos legales: alcanzables sin sesión, incluido por alguien que ya no
  // puede entrar a la app. Servirlos solo a usuarios autenticados dejaría sin
  // política justo a quien más la necesita.
  const isLegalDoc =
    request.nextUrl.pathname === '/privacidad' || request.nextUrl.pathname === '/terminos'

  // Si no hay sesión y el usuario intenta acceder a una ruta privada -> a /login
  if (!session && !isAuthRoute && !isPublicFeature && !isLegalDoc) {
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
    // - /api (todas las rutas de API). Cada handler se autentica por su cuenta
    //   con getUserId(); el middleware solo decide la redirección de páginas.
    // - Los Server Actions tampoco pasan por aquí: se despachan desde la propia
    //   página y validan su propio acceso (ver app/gasolina/actions.ts).
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
