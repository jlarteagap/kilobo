// scripts/audit-user-collections.ts
// Comprueba que el manifiesto de borrado de cuenta está completo.
//
// El borrado en cascada recorre una lista declarada. Si una colección con
// `user_id` no está en esa lista, sus datos sobreviven a la supresión del
// usuario: un fallo silencioso en la única función que existe para garantizar ese
// derecho.
//
// Este script es el control que convierte esa lista en algo verificable en vez
// de confiar en la revisión manual.
//
// Uso: npx tsx scripts/audit-user-collections.ts
// Sale con código 1 si hay colecciones con user_id fuera del manifiesto.

import 'dotenv/config'
import { adminDb } from '../src/lib/firebase.admin'
import { OWNED_COLLECTION_NAMES, SHARED_COLLECTIONS } from '../src/lib/user-data'

async function main() {
  const declared = new Set(OWNED_COLLECTION_NAMES)
  const shared = new Set(SHARED_COLLECTIONS)
  const undeclared: string[] = []

  const collections = await adminDb.listCollections()

  for (const col of collections) {
    const name = col.id
    if (shared.has(name)) continue

    // ¿Alguien tiene documentos aquí? Se busca el campo `user_id` con un límite
    // mínimo: basta con un documento para saber que la colección es del usuario.
    const probe = await col.where('user_id', '!=', null).limit(1).get()
    if (probe.empty) continue

    if (!declared.has(name)) {
      undeclared.push(name)
    }
  }

  // Las subcolecciones (debt_payments, installments, transactions bajo
  // investments) se cuelgan de un documento padre que ya está en el manifiesto
  // y se filtran por `user_id` de ese padre, así que no necesitan entrada propia.
  // Lo que sí importa es que no quede ninguna colección huérfana de primer nivel.

  if (undeclared.length > 0) {
    console.error('\n✗ Colecciones con `user_id` fuera del manifiesto de borrado:\n')
    for (const name of undeclared) console.error(`  - ${name}`)
    console.error('\nAñádelas a USER_COLLECTIONS en src/lib/user-data.ts, o márcalas')
    console.error('como compartidas si no pertenecen a un usuario.\n')
    process.exit(1)
  }

  console.log(`✓ ${collections.length} colecciones revisadas — el manifiesto cubre todas las de usuario.`)
  console.log(`  Declaradas: ${OWNED_COLLECTION_NAMES.length}. Compartidas (excluidas a propósito): ${shared.size}.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error auditando colecciones:', err)
    process.exit(1)
  })