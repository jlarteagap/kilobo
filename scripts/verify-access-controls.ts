// Verificación estática de los controles de acceso. Comprueba el código, no el
// comportamiento en red: confirma que cada mutación pasa por su puerta.
import { readFileSync } from 'node:fs'

const results: [string, boolean, string][] = []
const check = (name: string, ok: boolean, detail: string) => results.push([name, ok, detail])

// ─── 7.1 / 7.2 — estado compartido ───────────────────────────────────────────
const actions = readFileSync('src/app/gasolina/actions.ts', 'utf8')
const maint = readFileSync('src/app/gasolina/maintenance.actions.ts', 'utf8')
const guards = readFileSync('src/app/gasolina/guards.ts', 'utf8')

/** El cuerpo de una Server Action va del `export async function` a su llave de cierre en columna 0. */
function body(src: string, fn: string): string {
  const i = src.indexOf(`export async function ${fn}`)
  return i < 0 ? '' : src.slice(i, src.indexOf('\n}', i))
}

const MUTATORS = ['addTripAction','deleteTripAction','updateTripAction','closeCycleAction',
                  'setCycleSettledAction','updateClosedCycleAction','deleteCycleAction','resetAllAction']
const ALL_MUTATORS = [...MUTATORS, 'setAbsoluteOdometerAction', 'addMaintenanceLogAction', 'deleteMaintenanceLogAction']
const srcOf = (fn: string) => (MUTATORS.includes(fn) ? actions : maint)

// Si una acción se renombra, `body()` devuelve '' y varios chequeos pasan en
// falso. Este es el que lo delata.
const missing = ALL_MUTATORS.filter(fn => !srcOf(fn).includes(`export async function ${fn}`))
check('7.1 las 11 acciones mutantes existen', missing.length === 0,
      missing.length ? `no encontradas: ${missing.join(', ')}` : 'ninguna renombrada')

const GUARD_FNS = ['requireCarWriteLimit','requireResetLimit','requireCarSession']
const noGuards = GUARD_FNS.filter(fn => !guards.includes(`export async function ${fn}`))
check('7.1 las 3 guardas existen', noGuards.length === 0,
      noGuards.length ? `faltan: ${noGuards.join(', ')}` : GUARD_FNS.join(', '))

// ① Toda mutación pasa por el límite de tasa, sin excepción.
const noLimit = ALL_MUTATORS.filter(fn => !body(srcOf(fn), fn).includes('requireCarWriteLimit'))
check('7.1 las 11 mutantes con límite de tasa', noLimit.length === 0,
      noLimit.length ? `sin límite: ${noLimit.join(', ')}` : `${ALL_MUTATORS.length}/${ALL_MUTATORS.length}`)

// ③ Solo lo irreversible. El nombre de cada una es el que dice qué borra.
const DESTRUCTIVE = ['deleteTripAction','deleteCycleAction','resetAllAction','deleteMaintenanceLogAction']
const noSession = DESTRUCTIVE.filter(fn => !body(srcOf(fn), fn).includes('requireCarSession'))
check('7.2 lo irreversible exige sesión', noSession.length === 0,
      noSession.length ? `sin sesión: ${noSession.join(', ')}` : `${DESTRUCTIVE.length}/${DESTRUCTIVE.length}`)

// La contraparte: el registro diario NO pide credenciales.
const OPEN = ['addTripAction','updateTripAction','closeCycleAction','setCycleSettledAction',
              'updateClosedCycleAction','setAbsoluteOdometerAction','addMaintenanceLogAction']
const overGuarded = OPEN.filter(fn => body(srcOf(fn), fn).includes('requireCarSession'))
check('7.1 el registro diario no pide sesión', overGuarded.length === 0,
      overGuarded.length ? `piden sesión sin motivo: ${overGuarded.join(', ')}` : `${OPEN.length}/${OPEN.length}`)

// El límite por IP no puede frenar un reset, que es una sola petición.
check('7.2 resetAll con techo propio',
      body(actions, 'resetAllAction').includes('requireResetLimit'),
      '1 reset / 24 h')

// La lectura sigue siendo pública.
const READERS = ['getActiveCycleAction','getClosedCyclesAction']
const blocked = READERS.filter(fn => body(actions, fn).includes('requireCar'))
check('7.1 lecturas siguen públicas', blocked.length === 0,
      blocked.length ? `bloqueadas: ${blocked.join(', ')}` : `${READERS.length}/${READERS.length}`)

// deleteMaintenanceLogAction comprueba ANTES de leer el log: la lectura ya es
// trabajo que un tercero no debe poder provocar, y el borrado va detrás.
const dmBody = body(maint, 'deleteMaintenanceLogAction')
check('7.1 borrado de log valida antes de leer',
      dmBody.indexOf('requireCarSession') > -1 && dmBody.indexOf('requireCarSession') < dmBody.indexOf('findById'),
      'guard antes de findById')

check('7.1 el limitador acepta Headers', /clientIp\(headers: Headers\)/.test(readFileSync('src/lib/rate-limit.ts', 'utf8')),
      'necesario para usar headers() dentro de un Server Action')

// ─── 7.3 — rate limit ─────────────────────────────────────────────────────────
const rl = readFileSync('src/lib/rate-limit.ts', 'utf8')
// La rama de rechazo es el bloque `if (used >= limit.max) { ... }` completo.
// No debe contener ninguna escritura: un cliente bloqueado cuesta 1 lectura.
const rejectStart = rl.indexOf('if (used >= limit.max)')
const rejectEnd = rl.indexOf('}', rl.indexOf('return { ok: false'))
const rejectPath = rl.slice(rejectStart, rejectEnd)
const writes = ['runTransaction', 'tx.set', '.set(', '.update(']
check('7.3 el rechazo no escribe',
      rejectStart > -1 && !writes.some((w) => rejectPath.includes(w)),
      rejectStart < 0 ? 'rama no encontrada' : 'camino de 429 solo lee')

const sess = readFileSync('src/app/api/auth/session/route.ts', 'utf8')
check('7.3 429 con Retry-After', sess.includes('429') && sess.includes('Retry-After'), 'presente')
const ins = readFileSync('src/app/api/insights/route.ts', 'utf8')
check('7.3 refresh de insights limitado', ins.includes('guardedRateLimit') && ins.includes('Retry-After'), 'presente')

// identidad hasheada
check('7.3 identidad hasheada en Firestore', rl.includes("createHash('sha256')"), 'sha256')

// ─── 7.4 / 7.5 — datos del usuario ────────────────────────────────────────────
const acct = readFileSync('src/lib/user-account.ts', 'utf8')
const subCall = acct.indexOf('await deleteSubcollection(doc.ref.collection(sub))')
const parentDelete = acct.indexOf('batch.delete(d.ref)')
check('7.4 subcolecciones antes que el padre',
      subCall > -1 && parentDelete > subCall,
      subCall < 0 ? 'llamada no encontrada' : 'subcolecciones primero')
check('7.5 export filtra en la base de datos', acct.includes("where('user_id', '==', userId)"),
      'where en la query, no en memoria')

let bad = 0
for (const [name, ok, detail] of results) {
  console.log(`${ok ? '✓' : '✗'} ${name.padEnd(42)} ${detail}`)
  if (!ok) bad++
}
console.log(bad === 0 ? '\n✓ Todas las verificaciones pasan.' : `\n✗ ${bad} verificación(es) fallan.`)
process.exit(bad === 0 ? 0 : 1)
