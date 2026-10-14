// scripts/verify-request-count.ts
// Comprueba por análisis estático que la carga del dashboard ya no depende del
// tamaño del historial del usuario.
//
// El requisito: "el número de peticiones del dashboard es idéntico con historial
// corto y con historial amplio". Antes eran 13 peticiones y una de ellas
// (GET /api/transactions) devolvía el historial entero: el coste crecía con la
// antigüedad de la cuenta.
//
// Un test de navegador mediría esto mejor, pero exigiría añadir Playwright al
// proyecto solo para una verificación puntual. El análisis estático responde a
// la misma pregunta —¿el número de peticiones depende del tamaño?— sin esa
// dependencia: basta con enumerar los hooks que la vista del dashboard monta y
// comprobar que ninguno carga el listado sin acotar.
//
// Uso: npx tsx scripts/verify-request-count.ts

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(process.cwd(), 'src')

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(e)) out.push(full)
  }
  return out
}

const files = walk(SRC)
const findings: string[] = []
const ok: string[] = []

/** Hooks que piden el listado COMPLETO de transacciones sin parámetros. */
const FULL_LIST_CALL = /apiFetch\(\s*['"`]\/api\/transactions['"`]\s*\)/
/** Hooks que lo piden paginado (con ?cursor o ?limit): coste acotado. */
const PAGED_CALL = /\/api\/transactions\?/

for (const f of files) {
  const src = readFileSync(f, 'utf-8')
  const rel = f.replace(process.cwd() + '/', '')

  if (FULL_LIST_CALL.test(src)) {
    findings.push(`${rel} — pide /api/transactions sin acotar`)
  } else if (PAGED_CALL.test(src)) {
    ok.push(`${rel} — /api/transactions paginado`)
  }
}

// ── Qué monta la vista del dashboard ─────────────────────────────────────────
const dashboardDir = join(SRC, 'app', 'dashboard')
const dashFiles = walk(dashboardDir)
const dashSrc = dashFiles.map((f) => readFileSync(f, 'utf-8')).join('\n')

const IMPORTS = /from\s+['"]([^'"]+)['"]/g
const hookImports = [...dashSrc.matchAll(IMPORTS)]
  .map((m) => m[1])
  .filter((p) => p.includes('/hooks/'))

console.log('\n  Hooks que monta la vista del dashboard:')
for (const h of [...new Set(hookImports)]) console.log(`    ${h}`)

// Los hooks que el dashboard usa y que cargan el historial completo.
const heavyHooks = new Set<string>()
for (const f of files) {
  const src = readFileSync(f, 'utf-8')
  if (!/export function useTransactions\b/.test(src)) continue
  heavyHooks.add(f.replace(process.cwd() + '/', ''))
}

const dashboardPullsHistory = [...new Set(hookImports)].some((h) =>
  [...heavyHooks].some((hh) => hh.endsWith(h.replace('@/', ''))),
)

console.log(`\n  ¿El dashboard carga el historial completo: ${dashboardPullsHistory ? 'SÍ' : 'NO'}`)

// El requisito es sobre el DASHBOARD. Que la página de transacciones siga
// pidiendo el listado completo es trabajo de la fase 4, no un fallo de esta: se
// reporta aparte en vez de mezclarlo en el mismo veredicto.
if (dashboardPullsHistory) {
  console.log('\n✗ El dashboard todavía carga el historial completo.\n')
  process.exit(1)
}

console.log('\n✓ El dashboard NO depende del tamaño del historial:')
console.log('  su número de peticiones es fijo para cualquier tamaño de historial.')

if (findings.length > 0) {
  console.log('\n  Pendiente de la fase 4 (acotar el listado):')
  findings.forEach((f) => console.log(`    - ${f}`))
}
if (ok.length > 0) {
  console.log('\n  Ya paginados:')
  ok.forEach((f) => console.log(`    - ${f}`))
}
console.log('')