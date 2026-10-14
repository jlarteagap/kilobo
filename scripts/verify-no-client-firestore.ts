// scripts/verify-no-client-firestore.ts
// Las reglas de Firestore en `firestore.rules` deniegan TODO al cliente, lo cual es
// seguro porque todo el acceso real pasa por firebase-admin en el servidor, y las
// reglas se bypasean.
//
// Ese supuesto se rompe en silencio si alguien importa el SDK de cliente
// `firebase/firestore` en un componente o hook: el código compila, la regla lo
// bloquea en runtime, y el síntoma aparece como un fallo de permisos confuso en
// lugar de un error claro en CI.
//
// Uso: npx tsx scripts/verify-no-client-firestore.ts
// Sale con código 1 si encuentra acceso desde el cliente.

import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC = join(process.cwd(), 'src')

const files = new Map<string, string>()

function walk(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.tsx?$/.test(entry.name)) files.set(full, readFileSync(full, 'utf-8'))
  }
}
walk(SRC)

/** Resuelve de qué paquete viene un símbolo, distinguiendo admin vs cliente. */
function importSourceOf(content: string, symbol: string): 'admin' | 'client' | 'none' {
  for (const m of content.matchAll(
    /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g,
  )) {
    const named = m[1]
      .split(',')
      .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
    if (named.includes(symbol)) {
      return m[2].startsWith('firebase-admin') ? 'admin' : 'client'
    }
  }
  return 'none'
}

const violations: string[] = []
const push = (file: string, label: string) =>
  violations.push(`  ${relative(process.cwd(), file)} — ${label}`)

for (const [file, content] of files) {
  const isClientComponent = /^\s*['"]use client['"]/.test(content)

  // 1. Importar el SDK de cliente de Firestore es una infracción en sí mismo,
  //    venga de donde venga: ese SDK requiere contexto de navegador.
  if (/from\s+['"]firebase\/(?!admin)['"]/.test(content)) {
    push(file, "import del SDK de cliente 'firebase'")
  }

  // 2. getFirestore() u onSnapshot() solo son problema si vienen del cliente,
  //    o si aparecen en un componente marcado 'use client'.
  for (const symbol of ['getFirestore', 'onSnapshot', 'getDocs', 'collection', 'doc']) {
    if (!new RegExp(`\\b${symbol}\\s*\\(`).test(content)) continue

    const source = importSourceOf(content, symbol)
    if (source === 'admin') continue
    if (isClientComponent) {
      push(file, `${symbol}() en un componente 'use client'`)
    } else if (source === 'client') {
      push(file, `${symbol}() importado del SDK de cliente`)
    }
  }
}

if (violations.length > 0) {
  console.error('\n✗ Se detectó acceso a Firestore desde el cliente:\n')
  console.error(violations.join('\n'))
  console.error('\n`firestore.rules` deniega todo al cliente, así que esto fallaría en runtime.')
  console.error('Mueve el acceso al servidor (repositorios + servicios) o añade reglas')
  console.error('explícitas junto con una revisión de la exposición de datos.\n')
  process.exit(1)
}

console.log(`✓ ${files.size} archivos verificados — sin acceso a Firestore desde el cliente.`)
console.log('  Todo getFirestore/onSnapshot resuelven a firebase-admin.')
console.log('  firestore.rules (deny-all) es seguro desplegar.')