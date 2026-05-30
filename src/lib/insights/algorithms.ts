// lib/insights/algorithms.ts

import { Transaction, TransactionType } from '@/types/transaction'
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
  isWithinInterval,
  differenceInDays,
  format,
} from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthlySpend {
  month: string        // 'YYYY-MM'
  amount: number
}

export interface CategoryTrend {
  category_id: string
  category_name: string
  category_color: string | null
  monthly: MonthlySpend[]
  average: number
  current: number
  delta_pct: number   // % de cambio vs promedio
  trend: 'up' | 'down' | 'stable'
}

export interface Anomaly {
  category_id: string
  category_name: string
  category_color: string | null
  current_amount: number
  average_amount: number
  delta_pct: number
  severity: 'low' | 'medium' | 'high'   // >20% low, >50% medium, >100% high
  month: string
}

export interface SavingOpportunity {
  category_id: string
  category_name: string
  category_color: string | null
  monthly_average: number
  potential_saving: number    // 20% del promedio como target conservador
  insight: string             // texto corto para la IA ampliar
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
  total_income: number
  total_expenses: number
  savings_rate: number
  trends: CategoryTrend[]
  anomalies: Anomaly[]
  saving_opportunities: SavingOpportunity[]
  health_score: HealthScore
  top_categories: { name: string; amount: number; pct: number }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXPENSE_TYPES: TransactionType[] = ['EXPENSE']
const INCOME_TYPES: TransactionType[]  = ['INCOME']

function getMonthKey(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy-MM')
}

function getMonthsBack(n: number): { start: Date; end: Date; key: string }[] {
  return Array.from({ length: n }, (_, i) => {
    const base  = subMonths(new Date(), i)
    return {
      start : startOfMonth(base),
      end   : endOfMonth(base),
      key   : format(base, 'yyyy-MM'),
    }
  }).reverse()
}

function filterByPeriod(txs: Transaction[], start: Date, end: Date): Transaction[] {
  return txs.filter(tx => {
    const d = parseISO(tx.date)
    return isWithinInterval(d, { start, end })
  })
}

function sumAmount(txs: Transaction[]): number {
  return txs.reduce((acc, tx) => acc + tx.amount, 0)
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
      name = tx.project?.name ?? 'Proyecto';
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
    const monthly: MonthlySpend[] = periods.map(({ start, end, key }) => {
      const slice = filterByPeriod(expenses, start, end).filter(
        tx => (tx as any)._group_key === category_id,
      )
      return { month: key, amount: sumAmount(slice) }
    })

    // Ignorar categorías con todos los meses en 0
    if (monthly.every(m => m.amount === 0)) return

    const nonZero  = monthly.filter(m => m.amount > 0)
    const average  = nonZero.reduce((a, m) => a + m.amount, 0) / (nonZero.length || 1)
    const current  = monthly[monthly.length - 1].amount
    const delta    = average > 0 ? ((current - average) / average) * 100 : 0

    trends.push({
      category_id,
      category_name : meta.name,
      category_color: meta.color,
      monthly,
      average       : Math.round(average * 100) / 100,
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
      category_id    : trend.category_id,
      category_name  : trend.category_name,
      category_color : trend.category_color,
      current_amount : trend.current,
      average_amount : trend.average,
      delta_pct      : trend.delta_pct,
      severity,
      month          : currentMonth,
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
    if (trend.average < minMonthlyAmount) return

    const nameLC  = trend.category_name.toLowerCase()
    const isDiscretionary = DISCRETIONARY_HINTS.some(h => nameLC.includes(h))

    // Incluir si es discrecional O si la tendencia va al alza
    if (!isDiscretionary && trend.trend !== 'up') return

    const potential = Math.round(trend.average * 0.2 * 100) / 100 // 20% conservador

    opportunities.push({
      category_id    : trend.category_id,
      category_name  : trend.category_name,
      category_color : trend.category_color,
      monthly_average: trend.average,
      potential_saving: potential,
      insight        : `Promedio mensual $${trend.average} en ${trend.category_name}. ` +
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
  const monthlyExpenses = periods.map(({ start, end }) =>
    sumAmount(filterByPeriod(allTxs, start, end).filter(tx => EXPENSE_TYPES.includes(tx.type))),
  )
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

// ─── 5. Payload completo para la IA ───────────────────────────────────────────

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

  const trends       = detectTrends(transactions, monthsBack)
  const anomalies    = detectAnomalies(transactions, monthsBack, 20, trends)
  const opportunities = detectSavingOpportunities(transactions, monthsBack, 20, trends)
  const healthScore  = calculateHealthScore(transactions, monthsBack, trends, anomalies)

  // Top 5 categorías por gasto
  const topCategories = trends.slice(0, 5).map(t => ({
    name  : t.category_name,
    amount: t.current,
    pct   : totalExpenses > 0 ? Math.round((t.current / totalExpenses) * 100) : 0,
  }))

  return {
    period_months      : monthsBack,
    total_income       : Math.round(totalIncome * 100) / 100,
    total_expenses     : Math.round(totalExpenses * 100) / 100,
    savings_rate       : Math.round(savingsRate * 10) / 10,
    trends,
    anomalies,
    saving_opportunities: opportunities,
    health_score       : healthScore,
    top_categories     : topCategories,
  }
}