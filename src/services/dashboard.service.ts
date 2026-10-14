import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

import { transactionsRepository } from '@/repositories/transactions.repository'
import { accountsRepository } from '@/repositories/accounts.repository'
import { categoriesRepository } from '@/repositories/categories.repository'
import { projectRepository } from '@/repositories/project.repository'
import { budgetRepository } from '@/repositories/budget.repository'
import { debtRepository } from '@/repositories/debt.repository'

import { refreshRates, convertToBOB } from '@/lib/config/exchange-rates'
import { adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'
import {
  buildSankeyData,
  computeChartData,
  computeComparisonData,
  computeCumulativeByDay,
  computeFullStats,
  computeStats,
  computeTrends,
  type SankeyData,
} from '@/lib/metrics/dashboard-metrics'
import { calcBudgetProgress } from '@/lib/metrics/budget-progress'
import { parseLocalDate } from '@/utils/date.utils'

import type { PeriodStats } from '@/lib/metrics/dashboard-metrics'
import type { RecentTransaction } from '@/types/transaction'
import type { SankeyNode, SankeyLink } from '@/lib/metrics/dashboard-metrics'

const COLLECTION = 'dashboard_cache'
const CACHE_MINUTES = 5

const ymd = (d: Date) => format(d, 'yyyy-MM-dd')

export interface DashboardMetrics {
  monthlyStats: PeriodStats
  prevMonthlyStats: PeriodStats
  trends: { income: number; expense: number; net: number }
  comparisonData: ReturnType<typeof computeComparisonData>
  chartData: ReturnType<typeof computeChartData>
  sankey: SankeyData
  budgetProgress: ReturnType<typeof calcBudgetProgress>[]
  debtSummary: { pendingGiven: number; pendingReceived: number }
  recentTransactions: RecentTransaction[]
}

function empty(): DashboardMetrics {
  return {
    monthlyStats: { income: 0, expense: 0, net: 0, fixedExpense: 0, variableExpense: 0 },
    prevMonthlyStats: { income: 0, expense: 0, net: 0 },
    trends: { income: 0, expense: 0, net: 0 },
    comparisonData: [],
    chartData: [],
    sankey: { nodes: [] as SankeyNode[], links: [] as SankeyLink[] },
    budgetProgress: [],
    debtSummary: { pendingGiven: 0, pendingReceived: 0 },
    recentTransactions: [],
  }
}

/**
 * Calcula en el servidor todo lo que el dashboard muestra.
 *
 * El ahorro no está en evitar el cálculo, sino en dejar de descargar el
 * historial completo: se leen dos meses (el actual y el anterior, para la
 * comparación) en vez de años. La conversión de moneda no se puede expresar en
 * una agregación de Firestore porque depende del tipo de cambio vigente, así
 * que la suma se hace aquí sobre los documentos del periodo.
 */
export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const now = new Date()
  const currentFrom = ymd(startOfMonth(now))
  const currentTo = ymd(endOfMonth(now))
  const prevFrom = ymd(startOfMonth(subMonths(now, 1)))
  const prevTo = ymd(endOfMonth(subMonths(now, 1)))

  // Una sola ventana que cubre ambos periodos, para no hacer dos consultas.
  const windowFrom = prevFrom < currentFrom ? prevFrom : currentFrom
  const windowTo = currentTo > prevTo ? currentTo : prevTo

  await refreshRates()

  const [transactions, accounts, categories, projects, budgets, debts] = await Promise.all([
    transactionsRepository.findByPeriod(userId, windowFrom, windowTo),
    accountsRepository.findAll(userId),
    categoriesRepository.findAll(userId),
    projectRepository.findAll(userId),
    budgetRepository.findAll(userId),
    debtRepository.findAll(userId),
  ])

  const completed = transactions.filter((t) => t.status === 'COMPLETED')
  const currentTx = completed.filter((t) => t.date >= currentFrom && t.date <= currentTo)
  const prevTx = completed.filter((t) => t.date >= prevFrom && t.date <= prevTo)

  const currentDays = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }).map(ymd)
  const prevDays = eachDayOfInterval({
    start: startOfMonth(subMonths(now, 1)),
    end: endOfMonth(subMonths(now, 1)),
  }).map(ymd)

  const monthlyStats = computeFullStats(currentTx)
  const prevMonthlyStats = computeStats(prevTx)

  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      date: t.date,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      description: t.description ?? '',
      category: t.category_id
        ? (() => {
            const c = categoryById.get(t.category_id)
            return c ? { name: c.name, icon: c.icon ?? undefined } : null
          })()
        : null,
    }))

  const activeDebts = debts.filter((d) => d.status === 'ACTIVE')
  const pending = (type: string) =>
    activeDebts
      .filter((d) => d.type === type)
      .reduce((s, d) => s + convertToBOB(d.amount - d.paid_amount, d.currency), 0)

  const pendingGiven = pending('GIVEN')
  const pendingReceived = pending('RECEIVED')

  return {
    monthlyStats,
    prevMonthlyStats,
    trends: computeTrends(monthlyStats, prevMonthlyStats),
    comparisonData: computeComparisonData(
      computeCumulativeByDay(currentTx, currentDays),
      computeCumulativeByDay(prevTx, prevDays),
    ),
    chartData: computeChartData(currentTx, currentDays, (d) =>
      format(parseLocalDate(d), 'd MMM', { locale: es }),
    ),
    sankey: buildSankeyData(currentTx, categories, accounts, projects, currentFrom, currentTo),
    budgetProgress: budgets
      .filter((b) => b.is_active)
      .map((b) => calcBudgetProgress(b, transactions)),
    debtSummary: { pendingGiven, pendingReceived },
    recentTransactions: recent,
  }
}

// ─── Caché ────────────────────────────────────────────────────────────────────

/**
 * Caché con invalidación por escritura (design.md D5).
 *
 * La invalida `transactions.service.ts` al crear, editar o borrar, de modo que
 * registrar un movimiento no deja el dashboard mostrando lo anterior hasta que
 * venza la TTL. Sin eso habría que recargar la página para ver el efecto.
 */
async function readCache(userId: string): Promise<DashboardMetrics | null> {
  const snap = await adminDb.collection(COLLECTION).doc(userId).get()
  if (!snap.exists) return null
  const data = snap.data() as { expires_at: Date; payload: DashboardMetrics }
  if (new Date(data.expires_at) < new Date()) return null
  return data.payload
}

async function writeCache(userId: string, payload: DashboardMetrics): Promise<void> {
  await adminDb.collection(COLLECTION).doc(userId).set({
    payload,
    expires_at: Timestamp.fromMillis(Date.now() + CACHE_MINUTES * 60_000),
  })
}

/** La invalida se llama desde la capa de servicio al escribir. */
export async function invalidateDashboardCache(userId: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(userId).delete()
}

export async function getDashboardMetricsCached(userId: string): Promise<DashboardMetrics> {
  const cached = await readCache(userId)
  if (cached) return cached
  const payload = await getDashboardMetrics(userId)
  await writeCache(userId, payload)
  return payload
}

export { empty as emptyDashboardMetrics }