import { NextResponse } from 'next/server'

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
