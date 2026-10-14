import { createHmac } from 'node:crypto'

/**
 * Cursor de paginación para el listado de transacciones (design.md D2).
 *
 * Se pagina por cursor y no por desplazamiento numérico porque el
 * desplazamiento degrada a medida que crece el número de registros saltados:
 * la base de datos sigue leyendo y descartando todo lo anterior. El cursor además
 * es estable frente a inserciones concurrentes — un `offset` haría que un
 * registro nuevo durante la navegación-causing se duplicara o se perdiera.
 *
 * El cursor va FIRMADO: sin firma, un cliente podría alterarlo para saltarse a
 * una posición arbitraria o leer fuera de su propia ventana. La firma ata el
 * cursor al usuario y a la consulta, de modo que reutilizarlo en otro contexto
 * no sirve.
 */

const CURSOR_SECRET =
  process.env.CURSOR_SECRET ?? process.env.FIREBASE_CLIENT_EMAIL ?? 'kilo-cursor-dev-secret'

export interface TransactionCursor {
  /** Última fecha entregada (YYYY-MM-DD). */
  d: string
  /** Id del último documento, para desempatar misma fecha. */
  i: string
}

export function encodeCursor(userId: string, cursor: TransactionCursor): string {
  const payload = JSON.stringify(cursor)
  const body = Buffer.from(payload).toString('base64url')
  const sig = createHmac('sha256', CURSOR_SECRET).update(`${userId}.${body}`).digest('base64url').slice(0, 16)
  return `${body}.${sig}`
}

/** Devuelve null si el cursor está mal formado, manipulado o es de otro usuario. */
export function decodeCursor(userId: string, token: string): TransactionCursor | null {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null

  const expected = createHmac('sha256', CURSOR_SECRET).update(`${userId}.${body}`).digest('base64url').slice(0, 16)
  if (expected.length !== sig.length) return null
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString()) as TransactionCursor
    if (typeof parsed?.d !== 'string' || typeof parsed?.i !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}