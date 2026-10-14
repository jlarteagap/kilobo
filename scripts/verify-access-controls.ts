// Verificación estática de los controles de acceso. Comprueba el código, no el
// comportamiento en red: confirma que cada mutación pasa por su puerta.
import { readFileSync } from 'node:fs'

const results: [string, boolean, string][] = []
const check = (name: string, ok: boolean, detail: string) => results.push([name, ok, detail])

// ─── 7.1 / 7.2 — estado compartido ───────────────────────────────────────────
const actions = readFileSync('src/app/gasolina/actions.ts', 'utf8')
const MUTATORS = ['addTripAction','deleteTripAction','updateTripAction','closeCycleAction',
                  'setCycleSettledAction','updateClosedCycleAction','deleteCycleAction','resetAllAction']
const unguarded = MUTATORS.filter(fn => {
  const i = actions.indexOf(`export async function ${fn}`)
  if (i < 0) return true
  const body = actions.slice(i, actions.indexOf('\n}', i))
  return !body.includes('requireCarAccess')
})
check('7.1 acciones mutantes con token', unguarded.length === 0,
      unguarded.length ? `sin guard: ${unguarded.join(', ')}` : `${MUTATORS.length}/${MUTATORS.length} con guard`)

const READERS = ['getActiveCycleAction','getClosedCyclesAction']
const blocked = READERS.filter(fn => {
  const i = actions.indexOf(`export async function ${fn}`)
  return actions.slice(i, actions.indexOf('\n}', i)).includes('requireCarAccess')
})
check('7.1 lecturas siguen públicas', blocked.length === 0,
      blocked.length ? `bloqueadas: ${blocked.join(', ')}` : `${READERS.length}/${READERS.length} públicas`)

const maint = readFileSync('src/app/gasolina/maintenance.actions.ts', 'utf8')
check('7.1 mantenimiento con token', (maint.match(/requireCarAccess\(\)/g)?.length ?? 0) >= 4,
      `${maint.match(/await requireCarAccess\(\)/g)?.length ?? 0} guards (escritura + mantenimiento)`)

// deleteMaintenanceLogAction debe comprobar ANTES de leer el log
const dm = maint.indexOf('export async function deleteMaintenanceLogAction')
const dmBody = maint.slice(dm, maint.indexOf('\n}', dm))
check('7.1 borrado de log valida antes de leer',
      dmBody.indexOf('requireCarAccess') < dmBody.indexOf('findById'),
      'guard antes de findById')

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
