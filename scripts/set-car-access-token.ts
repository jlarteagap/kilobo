// scripts/set-car-access-token.ts
// Fija o rota el token de escritura del estado compartido de /gasolina.
//
// El estado es compartido entre varias personas y no pertenece a un usuario, así
// que la escritura se controla con un token compartido en lugar de con la sesión
// (design.md D1).
//
//   npx tsx scripts/set-car-access-token.ts <token>
//   npx tsx scripts/set-car-access-token.ts --generate
//
// Solo guarda el SHA-256 del token. Si se pierde el valor en claro hay que
// generar uno nuevo: no es recuperable, por diseño.

import 'dotenv/config'
import { generateAccessToken, setAccessToken } from '../src/lib/car-access'

async function main() {
  const arg = process.argv[2]

  if (!arg) {
    console.error('Uso: npx tsx scripts/set-car-access-token.ts <token|--generate>')
    process.exit(1)
  }

  const token = arg === '--generate' ? generateAccessToken() : arg

  if (arg === '--generate') {
    console.log('\n  Token generado (guárdalo ahora, no se vuelve a mostrar):\n')
    console.log(`  ${token}\n`)
  }

  await setAccessToken(token)
  console.log(`✓ Token almacenado (hash SHA-256). Copiar en los participantes.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error fijando el token:', err)
    process.exit(1)
  })