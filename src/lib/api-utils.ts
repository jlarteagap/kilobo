import { NextResponse } from 'next/server'
import type { RateLimit, RateLimitResult } from './rate-limit'
import { consumeRateLimit } from './rate-limit'

export function handleError(error: unknown, statusMap: Record<string, number> = {}): NextResponse {
  const message = error instanceof Error ? error.message : 'Error interno del servidor'
  const merged: Record<string, number> = {
    'No autorizado': 401,
    'Token inválido o expirado': 401,
    ...statusMap,
  }
  if (merged[message] !== undefined) {
    return NextResponse.json({ error: message }, { status: merged[message] })
  }
  for (const [key, status] of Object.entries(merged)) {
    if (message.includes(key)) {
      return NextResponse.json({ error: message }, { status })
    }
  }
  return NextResponse.json({ error: message }, { status: 500 })
}

/**
 * Verificación de origen para rutas que modifican estado (design.md D3).
 *
 * `sameSite=strict` ya bloquea el CSRF clásico en navegadores modernos, pero no
 * cubre peticiones desde un subdominio hermano (que cuenta como mismo sitio),
 * un XSS en el propio sitio, ni clientes que ignoran las políticas de cookie.
 *
 * La comparación preferente es contra `ALLOWED_ORIGIN`. Si no está definido se
 * cae al `Host` de la petición, que evita tener que configurar cada entorno
 * pero es más débil: un atacante que controle también la cabecera `Host`
 * podría hacer coincidir ambos valores.
 */
export function assertSameOrigin(req: Request): NextResponse | null {
  const origin = req.headers.get('origin')

  // Los navegadores envían `Origin` en toda petición que modifica estado,
  // incluidas las same-origin. Su ausencia en una ruta mutante no es legítima.
  if (!origin) {
    return NextResponse.json({ error: 'Origen ausente' }, { status: 403 })
  }

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return NextResponse.json({ error: 'Origen inválido' }, { status: 403 })
  }

  const allowed = process.env.ALLOWED_ORIGIN
  const expectedHost = allowed
    ? new URL(allowed).host
    : req.headers.get('host')

  if (!expectedHost || originHost !== expectedHost) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
  }

  return null
}

/**
 * Aplica el límite de tasa y devuelve la respuesta 429 con `Retry-After` cuando
 * el cupo se agota (spec: access-control/abuse-protection).
 *
 * `identity` es la clave de la que se responde. Se pasa ya resuelta — IP o id
 * de usuario — porque la decisión de qué cuenta como identidad corresponde a la
 * ruta, no a este helper.
 */
export async function assertRateLimit(
  scope: string,
  identity: string,
  limit: RateLimit,
): Promise<NextResponse | null> {
  const result = await consumeRateLimit(scope, identity, limit)
  return rateLimited(result)
}

/** Construye la respuesta 429 o devuelve null si la petición está admitida. */
export function rateLimited(result: RateLimitResult): NextResponse | null {
  if (result.ok) return null
  return NextResponse.json(
    { error: 'Demasiadas peticiones' },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSec) } },
  )
}