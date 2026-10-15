import { createHash } from 'node:crypto'
import { adminDb } from './firebase.admin'

/**
 * Limitador de tasa sobre contadores en Firestore (design.md D2).
 *
 * Decisión: Firestore en lugar de Redis para no añadir infraestructura. Se
 * asume explícitamente que esto cuesta una lectura y una escritura por petición
 * admitida — ver la sección "Optimización de coste" del design.
 *
 * Reglas de diseño que importan:
 *
 * 1. **Rechazar no escribe.** Un cliente bloqueado consume una lectura, no una
 *    escritura. Eso corta el vector de amplificación de escritura, que es el
 *    que cuesta.
 * 2. **Solo se limita lo necesario.** Limitar las 13 rutas del dashboard
 *    costaría 26 operaciones extra por carga. Por eso cada ruta declara su
 *    propio límite y casi todas no declaran ninguno.
 * 3. **La identidad se guarda hasheada.** Un identificador de IP o de usuario
 *    en claro dentro de la base de datos sería un dato personal adicional que
 *    la política de privacidad no declara.
 */

const COLLECTION = 'rate_limits'

export interface RateLimit {
  /** Peticiones permitidas por ventana. */
  max: number
  /** Duración de la ventana en segundos. */
  windowSec: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  /** Segundos hasta que la ventana se reinicia. Lo usa la cabecera Retry-After. */
  retryAfterSec: number
}

/**
 * Trunca los contadores a una ventana fija alineada al reloj. Una ventana fija
 * permite que un cliente disponga su tráfico justo antes del cambio de ventana,
 * así que el límite real en el peor caso es `2 × max`.
 */
function windowStart(nowMs: number, windowSec: number): number {
  return Math.floor(nowMs / 1000 / windowSec) * windowSec
}

/**
 * Identidad hasheada. Un atacante no puede reutilizar un documento ni alterar
 * su clave porque no conoce el prefijo sal que genera el hash.
 */
function docId(scope: string, identity: string, windowSec: number, startSec: number): string {
  const digest = createHash('sha256')
    .update(`${scope}:${identity}:${startSec}`)
    .digest('hex')
    .slice(0, 32)
  return `${scope}_${windowSec}_${startSec}_${digest}`
}

/**
 * IPv4 e IPv6 fragmentadas no deben contar como identidades distintas: el
 * prefijo se agrupa a /64, que es el tamaño de subred habitual en IPv6.
 */
/**
 * Acepta `Headers` y no `Request` porque el limitador también se aplica dentro de
 * Server Actions, donde no existe un `Request`: se lee de `headers()`.
 */
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  const candidate = fwd?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown'
  return candidate.includes(':') ? candidate.split(':').slice(0, 4).join(':') : candidate
}

/**
 * Comprueba y consume una unidad del cupo.
 *
 * Lanza si la propia base de datos falla: un limitador que falla abierto
 * cuando no puede leer deja la protección anulada sin avisar.
 */
export async function consumeRateLimit(
  scope: string,
  identity: string,
  limit: RateLimit,
): Promise<RateLimitResult> {
  const nowMs = Date.now()
  const startSec = windowStart(nowMs, limit.windowSec)
  const retryAfterSec = Math.max(1, startSec + limit.windowSec - Math.floor(nowMs / 1000))

  const ref = adminDb.collection(COLLECTION).doc(docId(scope, identity, limit.windowSec, startSec))
  const counter = await ref.get()
  const used = typeof counter.get('count') === 'number' ? (counter.get('count') as number) : 0

  if (used >= limit.max) {
    // Camino de rechazo: lectura y nada más.
    return { ok: false, remaining: 0, retryAfterSec }
  }

  // La condición dentro de la transacción evita que dos peticiones concurrentes
  // del mismo cliente superen ambas la comprobación previa.
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const current = typeof snap.get('count') === 'number' ? (snap.get('count') as number) : 0
    if (current >= limit.max) return
    tx.set(
      ref,
      { count: current + 1, expires_at: new Date((startSec + limit.windowSec) * 1000) },
      { merge: true },
    )
  })

  return { ok: true, remaining: Math.max(0, limit.max - used - 1), retryAfterSec }
}

/**
 * Variante en modo observativo (tarea 3.8): registra lo que habría bloqueado sin
 * bloquear nada, para calibrar el umbral contra tráfico real antes de activar.
 */
export async function peekRateLimit(
  scope: string,
  identity: string,
  limit: RateLimit,
): Promise<RateLimitResult> {
  const nowMs = Date.now()
  const startSec = windowStart(nowMs, limit.windowSec)
  const ref = adminDb.collection(COLLECTION).doc(docId(scope, identity, limit.windowSec, startSec))
  const counter = await ref.get()
  const used = typeof counter.get('count') === 'number' ? (counter.get('count') as number) : 0
  return {
    ok: used < limit.max,
    remaining: Math.max(0, limit.max - used),
    retryAfterSec: Math.max(1, startSec + limit.windowSec - Math.floor(nowMs / 1000)),
  }
}

// ─── Memo en proceso (tarea 3.4) ───────────────────────────────────────────────
//
// Amortiguador de ráfagas, NO el mecanismo de corrección. En serverless cada
// invocación es una instancia nueva, así que este memo casi nunca acierta; su
// valor real es cuando hay varias peticiones concurrentes sobre una instancia
// viva. Nunca puede *debilitar* el límite: solo lo hace más barato.
//
// TTL corto a propósito. Es un acelerador de coste, no un sistema contable.

const MEMO_TTL_MS = 2_000
const memo = new Map<string, { expiresAt: number; result: RateLimitResult }>()

function memoKey(scope: string, identity: string, windowSec: number, startSec: number): string {
  return docId(scope, identity, windowSec, startSec)
}

export async function consumeRateLimitMemoized(
  scope: string,
  identity: string,
  limit: RateLimit,
): Promise<RateLimitResult> {
  const nowMs = Date.now()
  const key = memoKey(scope, identity, limit.windowSec, windowStart(nowMs, limit.windowSec))

  const hit = memo.get(key)
  if (hit && hit.expiresAt > nowMs) return hit.result

  const result = await consumeRateLimit(scope, identity, limit)
  memo.set(key, { expiresAt: nowMs + MEMO_TTL_MS, result })

  // Poda barata para que el Map no crezca sin límite.
  if (memo.size > 5_000) {
    for (const [k, v] of memo) if (v.expiresAt <= nowMs) memo.delete(k)
  }

  return result
}

/**
 * Modo observativo (tarea 3.8). Con `RATE_LIMIT_MODE=observe` el limitador
 * registra lo que habría bloqueado y deja pasar la petición, para calibrar el
 * umbral contra tráfico real antes de activar el rechazo.
 *
 * Desactivarlo es cambiar una variable de entorno, no desplegar código: es lo
 * que permite activar los límites sin arriesgar dejar fuera a un usuario real.
 */
export function isObserving(): boolean {
  return process.env.RATE_LIMIT_MODE === 'observe'
}

export async function guardedRateLimit(
  scope: string,
  identity: string,
  limit: RateLimit,
): Promise<RateLimitResult> {
  if (!isObserving()) return consumeRateLimitMemoized(scope, identity, limit)

  const result = await peekRateLimit(scope, identity, limit)
  if (!result.ok) {
    console.warn(
      `[rate-limit:observe] ${scope} habría bloqueado a ${identity.slice(0, 8)}… ` +
        `(cupo ${limit.max}/${limit.windowSec}s). Quite RATE_LIMIT_MODE=observe para activar.`,
    )
  }
  return { ...result, ok: true }
}