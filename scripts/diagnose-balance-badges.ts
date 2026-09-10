// scripts/diagnose-balance-badges.ts
// Diagnóstico de solo lectura: por qué no se visualizan los badges de variación diaria.
// 1) Ejecuta las queries reales del badge y captura errores (p.ej. índice faltante).
// 2) Cuenta cuentas y registros de account_balance_changes para evaluar la falta de ancla.
import 'dotenv/config'
import { adminDb } from '../src/lib/firebase.admin'

const CHANGES = 'account_balance_changes'
const ACCOUNTS = 'accounts'

async function main() {
  const accountsSnap = await adminDb.collection(ACCOUNTS).limit(1000).get()
  console.log(`Total de cuentas: ${accountsSnap.size}`)

  const changesSnap = await adminDb.collection(CHANGES).limit(5000).get()
  console.log(`Total de registros de cambio: ${changesSnap.size}`)

  // Distribución: cuántas cuentas tienen registros y cuántos registros por cuenta
  const byAccount = new Map<string, number>()
  for (const doc of changesSnap.docs) {
    const accountId = doc.data().account_id
    byAccount.set(accountId, (byAccount.get(accountId) ?? 0) + 1)
  }
  console.log(`Cuentas con al menos 1 registro de cambio: ${byAccount.size}`)
  const sample = accountsSnap.docs[0]
  if (sample) {
    const data = sample.data()
    console.log(`\nCuenta de muestra: "${data.name}" (id=${sample.id}, user_id=${data.user_id}, balance=${data.balance})`)
    console.log(`Registros de esa cuenta: ${byAccount.get(sample.id) ?? 0}`)
  }

  if (!sample) {
    console.log('No hay cuentas para probar la query del badge.')
    return
  }
  const firstDoc = accountsSnap.docs[0]
  const userId = firstDoc.data().user_id
  const accountId = firstDoc.id
  const before = new Date()

  // Query v2 (variación diaria): la que usa el badge actual
  const queries: Array<{ label: string; run: () => Promise<unknown> }> = [
    {
      label: 'v2 · findLastBefore (where createdAt < before, orderBy desc)',
      run: () =>
        adminDb
          .collection(CHANGES)
          .where('user_id', '==', userId)
          .where('account_id', '==', accountId)
          .where('createdAt', '<', before)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get(),
    },
    {
      label: 'v1 · último cambio (orderBy desc sin rango)',
      run: () =>
        adminDb
          .collection(CHANGES)
          .where('user_id', '==', userId)
          .where('account_id', '==', accountId)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get(),
    },
  ]

  for (const q of queries) {
    try {
      const snap = (await q.run()) as { docs: unknown[] }
      console.log(`\n[OK]  ${q.label} → ${snap.docs.length} resultado(s)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`\n[FALLA] ${q.label}`)
      console.log(msg.slice(0, 400))
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})