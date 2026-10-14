// scripts/verify-pagination.ts
// Comprueba que la paginación por cursor devuelve el historial COMPLETO, sin
// omisiones ni duplicados.
//
// Es el escenario que la spec exige ("recorrer el cursor hasta el final obtiene
// la totalidad de sus transacciones, sin omisiones ni duplicados entre páginas")
// y el que falla en silencio si el desempate está mal: varias transacciones
// comparten fecha, así que un cursor por `date` a secas se las saltaría.
//
// Uso: npx tsx scripts/verify-pagination.ts <userId> [tamañoPagina]

import 'dotenv/config'
import { transactionsRepository } from '../src/repositories/transactions.repository'

async function main() {
  const userId = process.argv[2]
  const pageSize = Number(process.argv[3] ?? 50)
  if (!userId) {
    console.error('Uso: npx tsx scripts/verify-pagination.ts <userId> [pageSize]')
    process.exit(1)
  }

  const reference = await transactionsRepository.findAll(userId)
  const referenceIds = new Set(reference.map((t) => t.id))
  console.log(`\n  historial de referencia: ${reference.length} transacciones`)

  // Si no hay historial no hay nada que comprobar.
  if (reference.length === 0) {
    console.log('  sin datos; nada que verificar\n')
    return
  }

  const seen = new Set<string>()
  const dupes: string[] = []
  let cursor: { d: string; i: string } | null = null
  let pages = 0
  let guard = 0

  do {
    const res = await transactionsRepository.findPage(userId, pageSize, cursor)
    pages++
    for (const t of res.items) {
      if (seen.has(t.id)) dupes.push(t.id)
      seen.add(t.id)
    }
    cursor = res.nextCursor
    if (++guard > 500) { console.error('  ABORTO: demasiadas páginas, posible bucle'); process.exit(1) }
  } while (cursor)

  const missing = [...referenceIds].filter((id) => !seen.has(id))

  console.log(`  páginas recoridas: ${pages} (tamaño ${pageSize})`)
  console.log(`  transacciones recibidas: ${seen.size}`)
  console.log(`  duplicados: ${dupes.length}`)
  console.log(`  omitidas: ${missing.length}`)

  // El cursor firmado tiene que sobrevivir el viaje completo.
  if (cursor) console.error('  ¬ el cursor no se agotó tras el final')

  const ok = dupes.length === 0 && missing.length === 0 && seen.size === reference.length
  if (!ok) {
    if (dupes.length) console.error(`  duplicados: ${dupes.slice(0, 5).join(', ')}`)
    if (missing.length) console.error(`  omitidas: ${missing.slice(0, 5).join(', ')}`)
    console.error('\n✗ La paginación pierde o repite transacciones.\n')
    process.exit(1)
  }

  console.log('\n✓ Paginación completa: sin omisiones ni duplicados.\n')
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })