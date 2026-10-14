import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { adminDb } from './firebase.admin'

/**
 * Control de acceso al estado compartido de `/gasolina` y `/car-sharing`
 * (design.md D1).
 *
 * El estado NO pertenece a un usuario: varias personas aportan al mismo
 * vehículo y no todas tienen cuenta, así que la identidad de usuario no sirve
 * como control. Se protege con un token compartido que los participantes
 * presentan una vez.
 *
 * La LECTURA sigue siendo pública a propósito: el caso de uso es consultar el
 * estado desde el vehículo sin escribir credenciales. Solo la escritura exige
 * el token. Cambiar eso más adelante es aplicar el mismo helper a las lecturas.
 */

const CONFIG_DOC = adminDb.collection('car_sharing_config').doc('access')
const COOKIE_NAME = 'car_access'
const COOKIE_PATH = '/gasolina'

/** Genera un token nuevo. Solo se usa al rotarlo; no se genera en cada petición. */
export function generateAccessToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Fija el token esperado. Se usa en el despliegue inicial y en cada rotación.
 * Nótese que hash con SHA-256 no salta: el token tiene 256 bits de entropía,
 * así que la preimagen no es atacable por fuerza bruta.
 */
export async function setAccessToken(token: string): Promise<void> {
  await CONFIG_DOC.set({ token_hash: sha256(token), updated_at: new Date() }, { merge: true })
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

/** Comparación en tiempo constante: no filtra el valor por temporización. */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex')
  const bb = Buffer.from(b, 'hex')
  if (ba.length !== bb.length || ba.length === 0) return false
  return timingSafeEqual(ba, bb)
}

/** Valida el token EN CLARO, como lo presenta el participante en el formulario. */
export async function isValidAccessToken(candidate: string | undefined | null): Promise<boolean> {
  if (!candidate) return false
  const doc = await CONFIG_DOC.get()
  const stored = doc.get('token_hash')
  if (typeof stored !== 'string') return false
  return safeEqual(sha256(candidate), stored)
}

async function readCookie(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value
}

/**
 * ¿La petición actual está autorizada para escribir en el estado compartido?
 *
 * La cookie guarda el HASH del token, no el token, para que un volcado de
 * cookies no sirva directamente como credencial. Por eso se compara
 * directamente contra el hash almacenado, sin hashear de nuevo.
 */
export async function hasCarAccess(): Promise<boolean> {
  const digest = await readCookie()
  if (!digest) return false
  const doc = await CONFIG_DOC.get()
  const stored = doc.get('token_hash')
  if (typeof stored !== 'string') return false
  return safeEqual(digest, stored)
}

/** Emite la cookie de acceso tras validar el token. */
export async function grantCarAccess(token: string): Promise<boolean> {
  if (!(await isValidAccessToken(token))) return false
  const store = await cookies()
  store.set(COOKIE_NAME, sha256(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: COOKIE_PATH,
    maxAge: 60 * 60 * 24 * 30,
  })
  return true
}

export async function revokeCarAccess(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}