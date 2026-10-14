/**
 * Manifiesto de datos por usuario (tarea 6.1).
 *
 * Declarar el conjunto a mano sería frágil: una colección nueva podría quedar
 * fuera del borrado y dejar datos financieros huérfanos, que es justo lo que el
 * borrado de cuenta debe evitar. Por eso `scripts/audit-user-collections.ts`
 * compara este manifiesto contra lo que realmente existe en Firestore y falla
 * si hay alguna colección con `user_id` que no esté declarada.
 */

export interface OwnedCollection {
  name: string
  /** Subcolecciones que cuelgan de cada documento (Firestore no las borra en cascada). */
  subcollections?: string[]
}

/** Colecciones de primer nivel con campo `user_id`. */
export const USER_COLLECTIONS: OwnedCollection[] = [
  { name: 'users' },
  { name: 'accounts' },
  { name: 'transactions' },
  { name: 'category' },
  { name: 'budgets' },
  { name: 'projects' },
  { name: 'savings_goals' },
  { name: 'driver_config' },
  { name: 'driver_shifts' },
  { name: 'driver_deposits' },
  { name: 'account_balance_changes' },
  // Las subcolecciones cuelgan del documento padre, que ya se filtra por user_id.
  { name: 'debts', subcollections: ['debt_payments'] },
  { name: 'credits', subcollections: ['installments'] },
  { name: 'investments', subcollections: ['transactions'] },
  // Caché derivada. No es dato financiero en sí, pero se reconstruye desde las
  // transacciones y sin esta entrada quedaría huérfana tras la supresión.
  { name: 'insights' },
  // Sin escritor en el código actual: quedó de una iteración anterior (el
  // cálculo de proyección vive hoy en `lib/forecast/projection.ts`, en memoria).
  // Sigue teniendo documentos con `user_id`, así que se borran. Si se confirma
  // que la colección está vacía, quitarla del manifiesto.
  { name: 'forecast' },
]

/**
 * Colecciones SIN `user_id` porque su estado es compartido, no por usuario.
 *
 * `/gasolina` y `/car-sharing` son públicas y el estado pertenece a varias
 * personas (design.md D1). No se borran al eliminar una cuenta: no son de nadie
 * en concreto, y borrarlas dejaría el vehículo sin registro para el resto de
 * participantes.
 */
export const SHARED_COLLECTIONS = ['car_sharing_cycles', 'car_maintenance_logs', 'car_config']

export const OWNED_COLLECTION_NAMES = USER_COLLECTIONS.map((c) => c.name)