import {
  CarCycle,
  cycleBsPerKm,
  cycleBsPerLiter,
  cycleKm,
  cycleLitersPer100,
  round2,
} from '@/types/car-sharing'

/**
 * Con menos de 100 km, la carga de gasolina cubre quemado de ciclos anteriores,
 * asi que el L/100km del ciclo no describe al ciclo. Por encima de 30 L/100km el
 * dato no es creible y casi siempre es un odometer mal cargado.
 */
export const MIN_COMPARABLE_KM = 100
export const MAX_PLAUSIBLE_L100 = 30

/**
 * Piso de credibilidad. El baseline es el minimo historico, asi que un solo
 * valor absurdamente bajo lo arruina: los ciclos siguientes aparecen como
 * +2000% y la alerta deja de significar nada. Ocurre al teclear el odometro en el
 * campo de litros (500 en vez de 50), y es justo el mismo error que ya tiene su
 * propia advertencia en el registro de viajes.
 *
 * 2 L/100km esta por debajo de cualquier auto a gasolina convencional, asi que
 * no descarta nada real.
 */
export const MIN_PLAUSIBLE_L100 = 2

export const ALERT_THRESHOLD_PCT = 15
export const MIN_CYCLES_FOR_ALERT = 2

/** Alerta a partir del tercer ciclo comparable: con dos, el delta es ruido. */
export const MIN_CYCLES_FOR_MEANINGFUL_BASELINE = 3

export interface ConsumptionPoint {
  cycleId: string
  endDate: number
  km: number
  litersPer100: number
  gasAmount: number
  gasLiters: number
  bsPerKm: number | null
  bsPerLiter: number | null
  isBest: boolean
}

export interface ConsumptionSeries {
  points: ConsumptionPoint[]
  baseline: number | null
  latest: ConsumptionPoint | null
  deltaPct: number | null
  alert: boolean
  comparableCount: number
  /** Ciclos cerrados sin litros: el dato existe pero no es comparable. */
  skippedCount: number
  hasEnoughHistory: boolean
}

export function isComparable(cycle: CarCycle): boolean {
  const litersPer100 = cycleLitersPer100(cycle)
  if (litersPer100 === null) return false
  if (cycleKm(cycle) < MIN_COMPARABLE_KM) return false
  return (
    litersPer100 >= MIN_PLAUSIBLE_L100 && litersPer100 <= MAX_PLAUSIBLE_L100
  )
}

export function buildConsumptionSeries(cycles: CarCycle[]): ConsumptionSeries {
  const closed = cycles.filter(c => c.status === 'closed' && c.endDate !== null)
  const comparable = closed.filter(isComparable)
  const skippedCount = closed.length - comparable.length

  const points: ConsumptionPoint[] = comparable
    .map(cycle => ({
      cycleId: cycle.id,
      endDate: cycle.endDate as number,
      km: cycleKm(cycle),
      litersPer100: cycleLitersPer100(cycle) as number,
      gasAmount: cycle.gasAmount,
      gasLiters: cycle.gasLiters as number,
      bsPerKm: cycleBsPerKm(cycle),
      bsPerLiter: cycleBsPerLiter(cycle),
      isBest: false,
    }))
    .sort((a, b) => a.endDate - b.endDate)

  if (points.length === 0) {
    return {
      points: [],
      baseline: null,
      latest: null,
      deltaPct: null,
      alert: false,
      comparableCount: 0,
      skippedCount,
      hasEnoughHistory: false,
    }
  }

  const baseline = Math.min(...points.map(p => p.litersPer100))
  const best = points.find(p => p.litersPer100 === baseline)
  if (best) best.isBest = true

  const latest = points[points.length - 1]
  const deltaPct = baseline > 0 ? ((latest.litersPer100 - baseline) / baseline) * 100 : 0

  return {
    points,
    baseline,
    latest,
    deltaPct,
    alert: points.length >= MIN_CYCLES_FOR_ALERT && deltaPct > ALERT_THRESHOLD_PCT,
    comparableCount: points.length,
    skippedCount,
    hasEnoughHistory: points.length >= MIN_CYCLES_FOR_MEANINGFUL_BASELINE,
  }
}

export function averageLitersPer100(series: ConsumptionSeries): number | null {
  if (series.points.length === 0) return null
  const sum = series.points.reduce((acc, p) => acc + p.litersPer100, 0)
  return round2(sum / series.points.length)
}