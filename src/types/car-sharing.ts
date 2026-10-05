// src/types/car-sharing.ts
// Tipos y calculos por ciclo del reparto de gastos del auto. Viven fuera del
// repositorio porque los componentes cliente los necesitan y `repositories/`
// arrastra firebase-admin al bundle.

/**
 * De donde salio el trip.
 *
 * `shift`: se creo automaticamente al registrar un turno en `/conductor`, asi
 * que sus km ya quedaron sumados al odometro absoluto. Registrar esos mismos km
 * otra vez a mano desde `/gasolina` los cuenta dos veces y acorta los intervalos
 * de mantenimiento a la mitad.
 *
 * `manual`: se cargo directamente desde `/gasolina` (viajes que no son turnos).
 * Los docs anteriores a esta migracion no tienen el campo y se tratan como
 * `manual`, que es el comportamiento previo.
 */
export type CarTripSource = 'shift' | 'manual'

export interface CarTrip {
  userName: string
  initialKm: number
  finalKm: number
  totalKm: number
  /**
   * Cuando ocurrio el viaje, en epoch ms. Antes era el string `"DD/MM HH:mm"`
   * que armaba el cliente: no tinha anio, vivia en la zona horaria de quien
   * lo escribio y no se podia ordenar, asi que no servia para agrupar viajes
   * por mes. Los documentos anteriores guardan `legacyDate` y se convierten al
   * vuelo; la migracion los fija en `timestamp`.
   */
  timestamp?: number
  legacyDate?: string
  createdAt: number
  source?: CarTripSource
}

export interface DebtResult {
  name: string
  totalKm: number
  percentage: number
  cost: number
}

export interface CarCycle {
  id: string
  status: 'active' | 'closed'
  startDate: number
  endDate: number | null
  gasAmount: number
  /**
   * Litros de la carga que cerro el ciclo. Opcional a proposito: el precio del
   * litro cambia con los subsidios, asi que convertir Bs a litros con un precio
   * fijo falsea la comparacion entre ciclos. Si no se anoto, el ciclo sigue
   * aportando Bs/km y deudas, pero no entra en la comparacion de consumo.
   */
  gasLiters?: number | null
  paidBy: string | null
  trips: CarTrip[]
  debtSummary: DebtResult[]
  /**
   * Cuando se saldo la cuenta del ciclo. Ausente o `null` significa que sigue
   * pendiente. Los documentos anteriores a este feature no tienen el campo, y
   * ese es su estado real: nadie los marco pagado.
   */
  settledAt?: number | null
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * El odometro del auto es de tres digitos y da la vuelta: si el kilometraje final
 * es menor que el inicial, el viaje cruzó el 999.
 *
 * Vive aca y no en el repositorio porque el cliente necesita exactamente la
 * misma cuenta para avisar que un viaje no cuadra antes de enviarlo; si las dos
 * copias divergieran, la advertencia mentiria.
 */
export const ODOMETER_WRAP = 1000

export function computeTripKm(initialKm: number, finalKm: number): number {
  return finalKm >= initialKm
    ? finalKm - initialKm
    : ODOMETER_WRAP + finalKm - initialKm
}

/**
 * Distancia maxima que se acepta para un solo viaje sin pedir confirmacion.
 *
 * El auto hace ~10 L/100km y el tanque lleno ronda los 50 L, asi que 500 km es
 * mas que un tanque entero. Cualquier viaje mas largo que eso casi siempre es
 * un digito mal tipeado en un odometro de tres cifras, y el costo de colarlo
 * sin avisar es alto: reparte mal la deuda del ciclo y falsea la serie de
 * consumo, que es justamente lo que la pagina existe para mostrar.
 */
export const MAX_PLAUSIBLE_TRIP_KM = 500

/**
 * Devuelve el motivo por el que un viaje merece confirmacion, o `null` si es
 * razonable. No bloquea: el wrap del odometro produce kilometrajes grandes
 * legitimos y no queremos impedir que el usuario registre algo real.
 */
export function implausibleTripReason(
  initialKm: number,
  finalKm: number,
): string | null {
  const km = computeTripKm(initialKm, finalKm)
  if (km <= MAX_PLAUSIBLE_TRIP_KM) return null

  const wrapped = finalKm < initialKm
  return wrapped
    ? `El odómetro dio la vuelta (${initialKm} → ${finalKm}) y da ${km} km. ` +
      'Si el viaje fue corto, revisá que no falte un dígito.'
    : `Este viaje queda en ${km} km, más que un tanque lleno. ` +
      'Si el kilometraje real es otro, corregí el odómetro.'
}

export function cycleKm(cycle: Pick<CarCycle, 'trips'>): number {
  return cycle.trips.reduce((acc, t) => acc + (t.totalKm || 0), 0)
}

/**
 * Las tres metricas devuelven `null` cuando no hay dato suficiente. Nunca
 * `NaN` ni Infinity: los componentes las pintan tal cual y un `NaN` en el DOM
 * se ve como un bug.
 */
export function cycleBsPerKm(
  cycle: Pick<CarCycle, 'trips' | 'gasAmount'>,
): number | null {
  const km = cycleKm(cycle)
  if (km <= 0) return null
  return round2(cycle.gasAmount / km)
}

export function cycleLitersPer100(
  cycle: Pick<CarCycle, 'trips' | 'gasLiters'>,
): number | null {
  const liters = cycle.gasLiters
  const km = cycleKm(cycle)
  if (!liters || liters <= 0 || km <= 0) return null
  return round2((liters / km) * 100)
}

export function cycleBsPerLiter(
  cycle: Pick<CarCycle, 'gasAmount' | 'gasLiters'>,
): number | null {
  const liters = cycle.gasLiters
  if (!liters || liters <= 0) return null
  return round2(cycle.gasAmount / liters)
}

/**
 * Todos los deudores del ciclo menos quien puso la plata. Antes el panel
 * lateral usaba `debtSummary.find(d => d.name !== paidBy)`, que con tres
 * conductores solo encontraba el primero y descartaba al resto en silencio.
 */
export function cycleDebtors(
  cycle: Pick<CarCycle, 'debtSummary' | 'paidBy'>,
): DebtResult[] {
  if (!cycle.paidBy) return []
  return cycle.debtSummary.filter(d => d.name !== cycle.paidBy)
}