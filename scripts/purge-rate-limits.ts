// scripts/purge-rate-limits.ts
// Elimina los contadores de `rate_limits` cuya ventana ya venció.
//
// Los contadores se crean con `expires_at`. Firestore no ofrece TTL nativo en
// estos clientes, así que la purga es explícita: sin ella la colección crece de
// forma indefinida con una fila por combinación de cliente, ámbito y ventana.
//
// Uso: npx tsx scripts/purge-rate-limits.ts            (pura los vencidos)
//      npx tsx scripts/purge-rate-limits.ts --all      (vacía la colección)

import 'dotenv/config'
import { adminDb } from '../src/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'

const COLLECTION = 'rate_limits'
const purgeAll = process.argv.includes('--all')

async function main() {
  const col = adminDb.collection(COLLECTION)

  if (purgeAll) {
    let deleted = 0
    for (;;) {
      const snap = await col.limit(500).get()
      if (snap.empty) break
      const batch = adminDb.batch()
      snap.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()
      deleted += snap.size
    }
    console.log(`✓ ${deleted} contadores eliminados (colección vaciada).`)
    return
  }

  let deleted = 0
  for (;;) {
    // require() evita cargar el índice de 'expires_at' cuando aún no existe.
    const snap = await col
      .where('expires_at', '<=', Timestamp.now())
      .limit(500)
      .get()
    if (snap.empty) break

    const batch = adminDb.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    deleted += snap.size
  }

  console.log(`✓ ${deleted} contadores vencidos eliminados.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error purgando rate_limits:', err)
    process.exit(1)
  })