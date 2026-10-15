import { headers } from 'next/headers'
import { getUserId } from '@/lib/auth.server'
import { clientIp, guardedRateLimit } from '@/lib/rate-limit'

/**
 * Guardas de escritura del estado compartido de `/gasolina` (design.md D1).
 *
 * `/gasolina` es pública por diseño y usa Server Actions, que no pasan por
 * `middleware.ts`. El estado —ciclos, viajes, mantenimiento— no pertenece a un
 * usuario: varias personas aportan al mismo vehículo y no todas usan la app a
 * diario, así que la identidad de usuario no puede ser la puerta de entrada.
 *
 * El control se reparte por OPERACIÓN, según su consecuencia, no por feature:
 *
 *   ① rate limit por IP en las 11 mutaciones  → acota el volumen, no la identidad
 *   ② registro y consulta de uso diario        → abiertas, cero credenciales
 *   ③ irreversible o cruza al dinero          → exigen sesión
 *
 * La razón por la que no hay un token compartido está en `design.md` D1: se
 * probó y se descartó contra los datos reales.
 */

/**
 * Uso diario de una persona: una sesión de registro son unas 5 escrituras en un
 * par de minutos. 30/300s deja margen de sobra para un uso normal y aun así
 * acota a 6 escrituras por minuto lo que un tercero pueda hacer.
 */
const WRITE_LIMIT = { max: 30, windowSec: 300 } as const

/**
 * `resetAllAction` borra el historial completo del vehículo. Es una sola petición,
 * así que el límite de tasa por sí solo no la frena: una vez por día es un techo
 * que la fricción de la interfaz no puede prometer y el servidor sí.
 */
const RESET_LIMIT = { max: 1, windowSec: 86400 } as const

async function identity(): Promise<string> {
  return clientIp(await headers())
}

/** ① Aplica el límite de frecuencia. Rechaza ANTES de leer o escribir nada. */
export async function requireCarWriteLimit(): Promise<void> {
  const rate = await guardedRateLimit('car-write', await identity(), WRITE_LIMIT)
  if (!rate.ok) {
    throw new Error('Demasiadas escrituras seguidas. Probá de nuevo en un momento.')
  }
}

/** ①' Techo adicional, exclusivo de `resetAllAction`. Acumula con ①, no lo reemplaza. */
export async function requireResetLimit(): Promise<void> {
  const rate = await guardedRateLimit('car-reset', await identity(), RESET_LIMIT)
  if (!rate.ok) {
    throw new Error('El historial se reseteó hace menos de un día. Contactá a Jorge si fue un error.')
  }
}

/**
 * ③ Para lo que no tiene vuelta atrás.
 *
 * No es una puerta de uso diario: `resetAll`, `deleteCycle` y `deleteTrip` rehacen
 * el reparto de kilómetros —que es lo que cada quien le debe al otro— y
 * `deleteMaintenanceLogAction` borra la transacción asociada, es decir, toca el
 * fondo de mantenimiento de un usuario concreto. Es la única escritura de esta
 * página que sale del estado del auto y entra en finanzas personales.
 *
 * El mensaje va al portador de la sesión, no a quien hizo el click: quien puede
 * apretar el botón ya está autenticado.
 */
export async function requireCarSession(): Promise<void> {
  if (!(await getUserId())) {
    throw new Error('Esta operación no se puede deshacer: iniciá sesión para continuar.')
  }
}