// scripts/audit-query-indexes.ts
// Contrasta los patrones de consulta de los repositorios con `firestore.indexes.json`.
//
// Firestore exige índice compuesto en cuanto una consulta combina más de un
// campo, o filtra y ordena a la vez. Si falta, la consulta falla en producción
// con FAILED_PRECONDITION — pero no al escribir el código, sino cuando ya está
// desplegado. Este script convierte ese fallo en uno de integración continua.
//
// Los índices compuestos también se construyen de forma asíncrona y consumen
// lecturas mientras se crean, así que desplegarlos tarde no es una opción
// (design.md D1).
//
// Uso: npx tsx scripts/audit-query-indexes.ts
// Salida 1 si algún patrón compuesto no tiene índice declarado.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const REPOS = join(process.cwd(), 'src', 'repositories')
const INDEXES = join(process.cwd(), 'firestore.indexes.json')

// ─── 1. Mapa variable → colección ─────────────────────────────────────────────
const varToCollection = new Map<string, string>()
// variable de subcolección → `${padre}/${sub}`
const subCollections = new Map<string, string>()
// método que devuelve una subcolección → sub: `this.txCollection(id).orderBy(...)`
const methodSub = new Map<string, string>()

interface Query {
  file: string
  collection: string
  filters: string[]
  orders: string[]
  /** Consulta compuesta por asignación: solo se puede verificar el desempate. */
  nameTiebreaker?: boolean
}

const queries: Query[] = []

const COLL_CONST = /^const\s+([A-Za-z_]\w*)\s*=\s*adminDb\.collection\(['"](\w+)['"]\)/
const SUB_CONST = /^const\s+([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\.doc\([^)]*\)\.collection\(['"](\w+)['"]\)/

function analyse(file: string, src: string) {
  const rel = file.replace(process.cwd() + '/', '')

  // Resuelve primero los alias de subcolección: dependen del padre.
  for (const line of src.split('\n')) {
    const sub = SUB_CONST.exec(line.trim())
    if (sub) {
      const [, varName, parentVar, subName] = sub
      const parent = varToCollection.get(parentVar)
      if (parent) subCollections.set(varName, `${parent}/${subName}`)
    }
  }
  for (const line of src.split('\n')) {
    const m = COLL_CONST.exec(line.trim())
    if (m) varToCollection.set(m[1], m[2])
  }

  // Métodos que devuelven una subcolección, usados en cadena:
  //   txCollection(id) { return collection.doc(id).collection('transactions') }
  //   this.txCollection(id).orderBy('date','desc').orderBy('created_at','desc').get()
  for (const m of src.matchAll(
    /^\s{2}(\w+)\([^)]*\)[^{]*\{\s*return\s+\w+\.doc\([^)]*\)\.collection\(['"](\w+)['"]\)/gm,
  )) {
    methodSub.set(m[1], m[2])
  }

  // Encadena las llamadas contiguas de filtrado/ordenación hasta el get(). Sin
  // esto, trocear por `;` fusiona consultas distintas que no llevan punto y
  // coma, produciendo patrones imposibles.
  //
  // La colección puede venir de una variable (`creditsCollection.where(...)`)
  // o en línea (`adminDb.collection('transactions').where(...)`), que es como
  // está escrita `accountsRepository.isAccountInUse`.
  const CHAIN = new RegExp(
    String.raw`\b(?:\w+\s*(?:\([^)]*\)\s*)?)?` +
      String.raw`(?:\.\s*collection\(\s*(?:['"](\w+)['"]|(\w+))\s*\))?` +
      String.raw`\s*((?:\.\s*(?:where|orderBy|limit|startAt|endAt)\([^)]*\)\s*)+)` +
      String.raw`\.\s*(?:get|stream)\(`,
    'g',
  )

  // Las consultas compuestas por asignación (`let q = ...; q = q.where(...)`)
  // no son una cadena contigua y este extractor no las ve. Un `orderBy` por
  // `__name__` es la señal de que existe una de esas: siempre exige índice
  // compuesto, así que se reporta para que no pase inadvertida.
  // Solo las constantes declaradas en ESTE archivo: varToCollection es global
  // y tomarla prestada atribuiría la query al grupo de otro repositorio.
  const fileCollections = src.split("\n").map((l) => COLL_CONST.exec(l.trim())).filter(Boolean).map((m) => m![2])
  for (const hit of src.matchAll(/orderBy\(\s*['"]__name__['"]/g)) {
    void hit
    queries.push({
      file: rel,
      // El extractor no resuelve la colección en una query compuesta por
      // asignación; se atribuye al primer grupo del archivo, que en este
      // repositorio es donde vive la paginación por cursor.
      collection: fileCollections[0] ?? '<desconocida>',
      filters: ['<compuesta>', '__name__'],
      orders: ['__name__'],
      nameTiebreaker: true,
    })
  }

  for (const m of src.matchAll(CHAIN)) {
    const [, inlineLit, inlineVar, calls] = m

    const chainStart = m.index + m[0].indexOf(calls)

    // Identificador que precede a la cadena, para resolver el alias. Admite tanto
    // `creditsCollection.where(...)` como `this.txCollection(id).orderBy(...)`.
    const before = src.slice(Math.max(0, chainStart - 120), chainStart)
    const alias = before.match(/([A-Za-z_]\w*)(?:\([^)]*\))?\s*$/)

    const resolved = inlineLit
      ? inlineLit
      : inlineVar
        ? (varToCollection.get(inlineVar) ?? subCollections.get(inlineVar))
        : alias
          ? (varToCollection.get(alias[1]) ??
            subCollections.get(alias[1]) ??
            methodSub.get(alias[1]))
          : undefined

    if (!resolved) continue

    const filters = [...calls.matchAll(/\.where\(\s*['"](\w+)['"]/g)].map((x) => x[1])
    const orders = [...calls.matchAll(/\.orderBy\(\s*['"](\w+)['"]/g)].map((x) => x[1])
    if (filters.length === 0 && orders.length === 0) continue

    queries.push({ file: rel, collection: resolved, filters, orders })
  }
}

for (const name of readdirSync(REPOS)) {
  if (name.endsWith('.ts')) analyse(join(REPOS, name), readFileSync(join(REPOS, name), 'utf-8'))
}

// ─── 2. Índices declarados ────────────────────────────────────────────────────
/** Clave canónica: los filtros y la ordenación son indistinguibles en Firestore. */
function key(parts: string[]): string {
  return [...parts].sort().join(' | ')
}

// Un índice cubre un patrón si contiene todos sus campos, con cualquier orden.
function isCovered(pattern: string[], idxFields: string[]): boolean {
  const have = new Set(idxFields.map((f) => f.split(' ')[0]))
  return pattern.every((p) => have.has(p.split(' ')[0]))
}

// Firestore crea índices automáticos de campo único. Solo hace falta un índice
// compuesto cuando hay DOS O MÁS restricciones en total (filtros + ordenación):
// un único where, o un único orderBy sin filtro, ya lo cubre el automático.
const isSingleField = (q: Query) => q.filters.length + q.orders.length <= 1

const missing: string[] = []
const seen = new Set<string>()

for (const q of queries) {
  if (isSingleField(q)) continue

  const parts = [
    ...q.filters.map((f) => `${f} asc`),
    ...q.orders.map((o) => `${o} desc`),
  ]
  const signature = `${q.collection}::${key(parts)}`
  if (seen.has(signature)) continue
  seen.add(signature)

  // Busca el índice declarado más estrecho que cubra este patrón.
  const idxList = JSON.parse(readFileSync(INDEXES, 'utf-8')).indexes ?? []
  const covered = idxList.some((idx: { collectionGroup: string; fields: { fieldPath: string }[] }) => {
    if (idx.collectionGroup !== q.collection) return false
    const fields = idx.fields.map((f) => f.fieldPath)
    // En una query con desempate por __name__ no se conocen los filtros con
    // certeza, pero sí la regla: __name__ tiene que ser el ÚLTIMO campo del
    // índice. Firestore solo lo admite al final.
    if (q.nameTiebreaker) return fields[fields.length - 1] === '__name__'
    return isCovered(parts, idx.fields.map((f) => `${f.fieldPath} asc`))
  })
  if (!covered) missing.push(signature)
}

if (missing.length > 0) {
  console.error('\n✗ Patrones de consulta sin índice compuesto declarado:\n')
  for (const m of missing) console.error(`  - ${m}`)
  console.error(`\n${queries.length} patrones analizados en ${varToCollection.size} colecciones.`)
  console.error('Añádelos a firestore.indexes.json y despliegues ANTES del código que los usa.\n')
  process.exit(1)
}

console.log(`✓ ${queries.length} patrones analizados — todos los compuestos tienen índice.`)
console.log(`  Colecciones referenciadas: ${varToCollection.size}.`)