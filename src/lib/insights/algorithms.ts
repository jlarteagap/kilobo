// lib/insights/algorithms.ts

import { Transaction, TransactionType } from '@/types/transaction'
import { convertToBOB } from '@/lib/config/exchange-rates'
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
  isWithinInterval,
  getDaysInMonth,
  format,
} from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthlySpend {
  month: string        // 'YYYY-MM'
  amount: number
  is_projected: boolean  // true solo para el mes en curso
  /** El mes en curso ya alcanzó sus movimientos habituales: el monto es real,
   *  no una extrapolación (alquiler, suscripciones, un pago único). */
  is_complete: boolean
  /** Incertidumbre de la estimación, como % del valor.
   *  null en meses cerrados. Para n transacciones, el error relativo estándar
   *  de un conteo es ~1/√n: 1 → 100%, 25 → 20%, 100 → 10%.
   *  Es una cota inferior honesta — montos desiguales la hacen mayor. */
  projected_cv: number | null
}

export interface CategoryTrend {
  category_id: string
  category_name: string
  category_color: string | null
  monthly: MonthlySpend[]
  baseline: number     // promedio de los 3 meses previos (excluye el mes en curso)
  current: number      // mes en curso, extrapolado a mes completo
  delta_pct: number    // % de cambio vs. baseline
  trend: 'up' | 'down' | 'stable'
}

export interface Anomaly {
  category_id: string
  category_name: string
  category_color: string | null
  current_amount: number
  baseline_amount: number
  delta_pct: number
  severity: 'low' | 'medium' | 'high'   // >20% low, >50% medium, >100% high
  month: string
}

export interface SavingOpportunity {
  category_id: string
  category_name: string
  category_color: string | null
  monthly_baseline: number
  potential_saving: number    // 20% del baseline como target conservador
  insight: string             // texto corto descriptivo
}

export interface HealthScore {
  score: number               // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  breakdown: {
    savings_rate: number      // % de ingresos que se ahorran
    expense_stability: number // qué tan estables son los gastos
    budget_adherence: number  // si tienes anomalías negativas
  }
}

export interface InsightsPayload {
  period_months: number
  days_elapsed: number       // días transcurridos del mes en curso
  total_income: number
  total_expenses: number
  savings_rate: number
  trends: CategoryTrend[]
  anomalies: Anomaly[]
  saving_opportunities: SavingOpportunity[]
  health_score: HealthScore
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXPENSE_TYPES: TransactionType[] = ['EXPENSE']
const INCOME_TYPES: TransactionType[]  = ['INCOME']

/**
 * Movimientos por mes a partir del cual una categoría se considera "fluida"
 * (gasto repartido a lo largo del mes, prorrateo válido). Por debajo de este
 * umbral se trata como discreta: un pago de alquiler o suscripción ya ocurrido
 * no se extrapola.
 */
const DISCRETE_MONTHLY_MAX = 2

function getMonthKey(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy-MM')
}

/** Mes en curso: cuántos días pasaron y cuántos tiene. */
export function currentMonthProgress(): { daysElapsed: number; daysInMonth: number } {
  const now = new Date()
  return {
    daysElapsed : now.getDate(),
    daysInMonth : getDaysInMonth(now),
  }
}

/**
 * Ventana de N meses terminando en el mes en curso.
 * El mes en curso se marca para que `sumPeriod` lo extrapole a mes completo.
 */
function getMonthsBack(n: number): {
  start: Date
  end: Date
  key: string
  isCurrent: boolean
}[] {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const base  = subMonths(now, i)
    return {
      start     : startOfMonth(base),
      end       : endOfMonth(base),
      key       : format(base, 'yyyy-MM'),
      isCurrent : i === 0,
    }
  }).reverse()
}

function filterByPeriod(txs: Transaction[], start: Date, end: Date): Transaction[] {
  return txs.filter(tx => {
    const d = parseISO(tx.date)
    return isWithinInterval(d, { start, end })
  })
}

/**
 * Estima cuánto se gastará la categoría en el mes en curso.
 *
 * Extrapolar linealmente (gasto × días del mes ÷ días transcurridos) supone
 * ritmo parejo, y los gastos discretos lo rompen: el alquiler se paga una vez
 * el día 5, así que al día 6 el prorrateo da $10.500 y marca "+400%" sobre una
 * categoría ya pagada que no va a gastar un peso más.
 *
 * Por eso el prorrateo solo se aplica a categorías cuyo gasto se reparte a lo
 * largo del mes. Las discretas (≤ 2 movimientos por mes: alquiler,
 * suscripciones, un pago al año) son binarias — o ocurrieron o no ocurrieron —
 * y extrapolar un pago que ya ocurrió es inventar.
 *
 * La estimación sigue sin sesgo para las fluidas; lo que cambia es cuánto
 * conviene creerla según cuántas transacciones la sostienen.
 */
function projectPeriod(
  currentTxs     : Transaction[],
  avgMonthlyCount: number,
): { amount: number; cv: number; isComplete: boolean } {
  const total  = sumAmount(currentTxs)
  const count  = currentTxs.length
  const { daysElapsed, daysInMonth } = currentMonthProgress()

  if (daysElapsed >= daysInMonth) {
    return { amount: total, cv: 0, isComplete: true }   // mes cerrado
  }

  // Categoría discreta: el gasto registrado ES el gasto del mes.
  if (avgMonthlyCount <= DISCRETE_MONTHLY_MAX) {
    return {
      amount     : total,
      // Aún puede faltar el movimiento pendiente, pero no es una estimación
      // de ritmo: es lo que pasó.
      cv         : count > 0 ? 10 : 100,
      isComplete : count > 0,
    }
  }

  if (count === 0) {
    return { amount: 0, cv: 100, isComplete: false }
  }

  const amount = total * (daysInMonth / daysElapsed)
  const cv     = Math.min(100, (1 / Math.sqrt(count)) * 100)
  return { amount, cv: Math.round(cv), isComplete: false }
}

function sumAmount(txs: Transaction[]): number {
  return txs.reduce((acc, tx) => acc + convertToBOB(tx.amount, tx.currency), 0)
}

// ─── 1. Trends por categoría ──────────────────────────────────────────────────

export function detectTrends(
  transactions: Transaction[],
  monthsBack = 3,
): CategoryTrend[] {
  const periods = getMonthsBack(monthsBack)
  const expenses = transactions.filter(tx =>
    EXPENSE_TYPES.includes(tx.type) && (tx.category_id || tx.project_id) && tx.status === 'COMPLETED',
  )

  // Agrupar categorías/proyectos únicos
  const categoryMap = new Map<string, { name: string; color: string | null }>()
  
  expenses.forEach(tx => {
    let key = '';
    let name = '';
    let color: string | null = null;

    if (tx.project_id) {
      key = `project:${tx.project_id}`;
      name = tx.project?.name ?? 'Actividad';
      color = tx.project?.color ?? null;
      if (tx.subtype) {
        key += `::${tx.subtype}`;
        name += ` - ${tx.subtype}`;
      }
    } else if (tx.category_id) {
      key = `category:${tx.category_id}`;
      name = tx.category?.name ?? 'Sin categoría';
      color = tx.category?.color ?? null;
      if (tx.tag) {
        key += `::${tx.tag}`;
        name += ` - ${tx.tag}`;
      }
    }

    if (key && !categoryMap.has(key)) {
      categoryMap.set(key, { name, color })
    }
    
    // Asignar llave temporal
    ;(tx as any)._group_key = key;
  })

  const trends: CategoryTrend[] = []

  categoryMap.forEach((meta, category_id) => {
    const slices = periods.map(({ start, end }) =>
      filterByPeriod(expenses, start, end).filter(
        tx => (tx as any)._group_key === category_id,
      ),
    )

    // Movimientos que esta categoría suele hacer por mes. Si el mes en curso
    // ya los alcanzó, su gasto está completo y no se extrapola.
    const historicalCounts = slices.slice(0, -1).map(s => s.length)
    const avgHistoricalCount = historicalCounts.length > 0
      ? historicalCounts.reduce((a, c) => a + c, 0) / historicalCounts.length
      : Infinity

    const monthly: MonthlySpend[] = periods.map(({ key, isCurrent }, i) => {
      const slice = slices[i]

      if (!isCurrent) {
        return {
          month         : key,
          amount        : Math.round(sumAmount(slice) * 100) / 100,
          is_projected  : false,
          is_complete   : true,
          projected_cv  : null,
        }
      }

      const projection = projectPeriod(slice, avgHistoricalCount)
      return {
        month         : key,
        amount        : Math.round(projection.amount * 100) / 100,
        is_projected  : true,
        is_complete   : projection.isComplete,
        projected_cv  : projection.cv,
      }
    })

    // Ignorar categorías con todos los meses en 0
    if (monthly.every(m => m.amount === 0)) return

    // Baseline = promedio de los 3 meses previos, EXCLUYENDO el mes en curso.
    // Comparar contra un promedio que incluye el propio mes que se mide
    // comprime el delta y lo vuelve artificialmente plano.
    //
    // Los meses en cero CUENTAN. Una categoría que gastás $0 en 2 de cada 3
    // meses tiene un promedio real de $105/mes, no de $420: si promediáramos
    // solo los meses con gasto, un gasto 4.8x mayor que tu promedio se
    // reportaría como "+19%, sin cambio" y se silenciaría justo la anomalía
    // que más importa detectar.
    const baselineWindow = monthly.slice(-4, -1)
    const baseline = baselineWindow.length > 0
      ? baselineWindow.reduce((a, m) => a + m.amount, 0) / baselineWindow.length
      : 0

    const current = monthly[monthly.length - 1].amount
    const delta   = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0

    trends.push({
      category_id,
      category_name : meta.name,
      category_color: meta.color,
      monthly,
      baseline      : Math.round(baseline * 100) / 100,
      current       : Math.round(current * 100) / 100,
      delta_pct     : Math.round(delta * 10) / 10,
      trend         : delta > 5 ? 'up' : delta < -5 ? 'down' : 'stable',
    })
  })

  return trends.sort((a, b) => b.current - a.current)
}

// ─── 2. Anomalías ─────────────────────────────────────────────────────────────

export function detectAnomalies(
  transactions: Transaction[],
  monthsBack = 3,
  threshold = 20,           // % mínimo para considerar anomalía
  trends?: CategoryTrend[],
): Anomaly[] {
  const resolved = trends ?? detectTrends(transactions, monthsBack)
  const anomalies: Anomaly[] = []

  resolved.forEach(trend => {
    if (Math.abs(trend.delta_pct) < threshold) return
    if (trend.current === 0) return

    const severity: Anomaly['severity'] =
      Math.abs(trend.delta_pct) > 100 ? 'high'
      : Math.abs(trend.delta_pct) > 50  ? 'medium'
      : 'low'

    const currentMonth = getMonthKey(new Date().toISOString())

    anomalies.push({
      category_id     : trend.category_id,
      category_name   : trend.category_name,
      category_color  : trend.category_color,
      current_amount  : trend.current,
      baseline_amount : trend.baseline,
      delta_pct       : trend.delta_pct,
      severity,
      month           : currentMonth,
    })
  })

  // Ordenar: primero las más severas y las alzas (gastos que subieron)
  return anomalies.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 }
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity]
    }
    return b.delta_pct - a.delta_pct
  })
}

// ─── 3. Oportunidades de ahorro ───────────────────────────────────────────────

export function detectSavingOpportunities(
  transactions: Transaction[],
  monthsBack = 3,
  minMonthlyAmount = 20,    // ignorar categorías con gasto < $20/mes
  trends?: CategoryTrend[],
): SavingOpportunity[] {
  const resolved = trends ?? detectTrends(transactions, monthsBack)

  // Categorías discrecionales típicas donde hay margen de ahorro
  const DISCRETIONARY_HINTS = [
    'restaurante', 'restaurant', 'comida', 'food',
    'entretenimiento', 'entertainment', 'streaming',
    'ropa', 'clothing', 'shopping', 'compras',
    'bar', 'café', 'cafe', 'coffee',
    'delivery', 'uber', 'taxi', 'transporte',
    'suscripci', 'subscri',
  ]

  const opportunities: SavingOpportunity[] = []

  resolved.forEach(trend => {
    if (trend.baseline < minMonthlyAmount) return

    const nameLC  = trend.category_name.toLowerCase()
    const isDiscretionary = DISCRETIONARY_HINTS.some(h => nameLC.includes(h))

    // Incluir si es discrecional O si la tendencia va al alza
    if (!isDiscretionary && trend.trend !== 'up') return

    const potential = Math.round(trend.baseline * 0.2 * 100) / 100 // 20% conservador

    opportunities.push({
      category_id     : trend.category_id,
      category_name   : trend.category_name,
      category_color  : trend.category_color,
      monthly_baseline: trend.baseline,
      potential_saving: potential,
      insight         : `Promedio de $${trend.baseline} en ${trend.category_name} los últimos meses. ` +
                        `Reducir 20% ahorraría ~$${potential}/mes.`,
    })
  })

  return opportunities
    .sort((a, b) => b.potential_saving - a.potential_saving)
    .slice(0, 5)  // top 5
}

// ─── 4. Health Score ──────────────────────────────────────────────────────────

export function calculateHealthScore(
  transactions: Transaction[],
  monthsBack = 3,
  trends?: CategoryTrend[],
  anomalies?: Anomaly[],
): HealthScore {
  const periods  = getMonthsBack(monthsBack)
  const allTxs   = transactions.filter(tx => tx.status === 'COMPLETED')

  // Savings rate — % ingresos que no se gastan
  const totalIncome   = sumAmount(allTxs.filter(tx => INCOME_TYPES.includes(tx.type)))
  const totalExpenses = sumAmount(allTxs.filter(tx => EXPENSE_TYPES.includes(tx.type)))
  const savingsRate   = totalIncome > 0
    ? Math.max(0, ((totalIncome - totalExpenses) / totalIncome) * 100)
    : 0

  // Expense stability — coeficiente de variación mensual (menor = más estable)
  // El mes en curso se extrapola para no penalizar la estabilidad con un mes a medias.
  const monthlyExpenses = periods.map(({ start, end, isCurrent }) => {
    const slice = filterByPeriod(allTxs, start, end).filter(tx => EXPENSE_TYPES.includes(tx.type))
    if (!isCurrent) return sumAmount(slice)
    // Infinity = nunca se considera "completo": el agregado fluye todo el mes.
    return projectPeriod(slice, Infinity).amount
  })
  const avgMonthly = monthlyExpenses.reduce((a, b) => a + b, 0) / periods.length
  const variance   = monthlyExpenses.reduce((a, b) => a + Math.pow(b - avgMonthly, 2), 0) / periods.length
  const stdDev     = Math.sqrt(variance)
  const cv         = avgMonthly > 0 ? (stdDev / avgMonthly) * 100 : 0
  const stability  = Math.max(0, 100 - cv)  // cv alto = inestable

  // Budget adherence — penaliza por anomalías severas
  const resolvedAnomalies = anomalies ?? detectAnomalies(transactions, monthsBack, 20, trends)
  const highAnomalies  = resolvedAnomalies.filter(a => a.severity === 'high').length
  const medAnomalies   = resolvedAnomalies.filter(a => a.severity === 'medium').length
  const adherence      = Math.max(0, 100 - highAnomalies * 20 - medAnomalies * 10)

  // Score final ponderado
  const score = Math.round(
    savingsRate  * 0.5 +   // 50% peso al ahorro
    stability    * 0.3 +   // 30% estabilidad
    adherence    * 0.2,    // 20% adherencia
  )

  const capped  = Math.min(100, Math.max(0, score))
  const grade   = capped >= 80 ? 'A'
    : capped >= 65 ? 'B'
    : capped >= 50 ? 'C'
    : capped >= 35 ? 'D'
    : 'F'

  return {
    score: capped,
    grade,
    breakdown: {
      savings_rate      : Math.round(savingsRate),
      expense_stability : Math.round(stability),
      budget_adherence  : Math.round(adherence),
    },
  }
}

// ─── 5. Payload completo ──────────────────────────────────────────────────────

export function buildInsightsPayload(
  transactions: Transaction[],
  monthsBack = 3,
): InsightsPayload {
  const completed    = transactions.filter(tx => tx.status === 'COMPLETED')
  const expenses     = completed.filter(tx => EXPENSE_TYPES.includes(tx.type))
  const income       = completed.filter(tx => INCOME_TYPES.includes(tx.type))

  const totalIncome   = sumAmount(income)
  const totalExpenses = sumAmount(expenses)
  const savingsRate   = totalIncome > 0
    ? ((totalIncome - totalExpenses) / totalIncome) * 100
    : 0

  const trends        = detectTrends(transactions, monthsBack)
  const anomalies     = detectAnomalies(transactions, monthsBack, 20, trends)
  const opportunities = detectSavingOpportunities(transactions, monthsBack, 20, trends)
  const healthScore   = calculateHealthScore(transactions, monthsBack, trends, anomalies)

  const { daysElapsed, daysInMonth } = currentMonthProgress()

  return {
    period_months      : monthsBack,
    days_elapsed       : daysElapsed === daysInMonth ? 0 : daysElapsed,
    total_income       : Math.round(totalIncome * 100) / 100,
    total_expenses     : Math.round(totalExpenses * 100) / 100,
    savings_rate       : Math.round(savingsRate * 10) / 10,
    trends,
    anomalies,
    saving_opportunities: opportunities,
    health_score       : healthScore,
  }
}