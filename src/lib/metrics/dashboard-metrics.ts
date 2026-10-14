import type { Transaction, ChartDataPoint } from '@/types/transaction'
import type { Category } from '@/types/category'
import type { Account } from '@/types/account'
import type { Project } from '@/types/project'
import { convertToBOB } from '@/lib/config/exchange-rates'
import { NODE_COLORS } from './sankey'

/**
 * Cálculos puros de las métricas del dashboard.
 *
 * Sin React y sin red a propósito: son funciones puras que el SERVIDOR usa para
 * responder ya agregado y que el cliente ya no necesita repetir. Que exista una
 * sola implementación es lo que garantiza que las cifras no cambien al mover
 * el cálculo de un lado al otro — que es el riesgo real de esta migración.
 */

export interface PeriodStats {
  income: number
  expense: number
  net: number
  fixedExpense?: number
  variableExpense?: number
}

export function inPeriod(t: { date: string }, from: string, to: string): boolean {
  return t.date >= from && t.date <= to
}

export function computeStats(list: Transaction[]): PeriodStats {
  const income = list
    .filter((t) => t.type === 'INCOME')
    .reduce((s, t) => s + convertToBOB(t.amount, t.currency), 0)
  const expense = list
    .filter((t) => t.type === 'EXPENSE')
    .reduce((s, t) => s + convertToBOB(t.amount, t.currency), 0)
  return { income, expense, net: income - expense }
}

/** Gastos fijos = los marcados como recurrentes (proxy de suscripciones). */
export function computeFullStats(list: Transaction[]): PeriodStats {
  const base = computeStats(list)
  const fixedExpense = list
    .filter((t) => t.type === 'EXPENSE' && t.is_recurring)
    .reduce((s, t) => s + convertToBOB(t.amount, t.currency), 0)
  return { ...base, fixedExpense, variableExpense: base.expense - fixedExpense }
}

export function computeTrends(current: PeriodStats, previous: PeriodStats) {
  const calc = (c: number, p: number) => (p === 0 ? (c > 0 ? 100 : 0) : ((c - p) / p) * 100)
  return {
    income: calc(current.income, previous.income),
    expense: calc(current.expense, previous.expense),
    net: calc(current.net, previous.net),
  }
}

/** Acumulado día a día, que es lo que grafica la comparación mensual. */
export function computeCumulativeByDay(
  list: Transaction[],
  days: string[],
): { expense: number; income: number }[] {
  return days.reduce<{ expense: number; income: number }[]>((acc, dateStr) => {
    const dayTx = list.filter((t) => t.date.startsWith(dateStr))
    const prev = acc.length > 0 ? acc[acc.length - 1] : { expense: 0, income: 0 }
    acc.push({
      expense: prev.expense + sum(dayTx, 'EXPENSE'),
      income: prev.income + sum(dayTx, 'INCOME'),
    })
    return acc
  }, [])
}

function sum(list: Transaction[], type: 'INCOME' | 'EXPENSE'): number {
  return list
    .filter((t) => t.type === type)
    .reduce((s, t) => s + convertToBOB(t.amount, t.currency), 0)
}

export function computeComparisonData(
  current: { expense: number; income: number }[],
  previous: { expense: number; income: number }[],
): { day: number; currentExpense: number | null; currentIncome: number | null; previousExpense: number | null; previousIncome: number | null }[] {
  const maxDays = Math.max(current.length, previous.length)
  const out: ReturnType<typeof computeComparisonData> = []
  for (let i = 0; i < maxDays; i++) {
    const p = previous[previous.length - 1]
    out.push({
      day: i + 1,
      currentExpense: i < current.length ? current[i].expense : null,
      currentIncome: i < current.length ? current[i].income : null,
      previousExpense: i < previous.length ? previous[i].expense : p?.expense ?? null,
      previousIncome: i < previous.length ? previous[i].income : p?.income ?? null,
    })
  }
  return out
}

/** Ingresos y gastos por día, con el desglose por moneda que usa el gráfico. */
export function computeChartData(list: Transaction[], days: string[], labelOf: (d: string) => string): ChartDataPoint[] {
  const dayMap = new Map<string, ChartDataPoint>(
    days.map((d) => [d, { date: d, income: 0, expense: 0, label: labelOf(d) } as ChartDataPoint]),
  )

  for (const t of list) {
    const entry = dayMap.get(t.date)
    if (!entry) continue
    const amount = convertToBOB(t.amount, t.currency)
    if (t.type === 'INCOME') {
      entry.income += amount
      entry.incomeByCurrency ??= {}
      entry.incomeByCurrency[t.currency] = (entry.incomeByCurrency[t.currency] ?? 0) + t.amount
    }
    if (t.type === 'EXPENSE') {
      entry.expense += amount
      entry.expenseByCurrency ??= {}
      entry.expenseByCurrency[t.currency] = (entry.expenseByCurrency[t.currency] ?? 0) + t.amount
    }
  }

  return Array.from(dayMap.values())
}

export interface SankeyNode {
  name: string
  type?: 'income' | 'expense' | 'account' | 'balance' | 'project' | 'subtype' | 'transfer'
  color?: string
  breakdown?: Record<string, number>
}

export interface SankeyLink {
  source: number
  target: number
  value: number
  stroke?: string
}

export interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

/**
 * Grafo de flujo de caja: de dónde viene y a dónde va el dinero.
 *
 * Se construye en el servidor. Antes lo armaba el navegador recorriendo el
 * historial completo en cada render (design.md D4).
 */
export function buildSankeyData(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  projects: Project[],
  from: string,
  to: string,
): SankeyData {
  const filtered = transactions.filter((t) => inPeriod(t, from, to))

  const nodeMap = new Map<string, number>()
  const nodes: SankeyNode[] = []

  const getNodeIndex = (key: string, name: string, type?: SankeyNode['type'], color?: string): number => {
    if (!nodeMap.has(key)) {
      nodeMap.set(key, nodes.length)
      nodes.push({ name, type, color: color ?? (type ? NODE_COLORS[type] : '#3B82F6') })
    }
    return nodeMap.get(key)!
  }

  const links: SankeyLink[] = []
  const upsertLink = (source: number, target: number, value: number) => {
    if (value <= 0 || source === target) return
    const existing = links.find((l) => l.source === source && l.target === target)
    if (existing) existing.value += value
    else links.push({ source, target, value })
  }

  const accountFlows = new Map<string, { in: number; out: number }>(
    accounts.map((a) => [a.id, { in: 0, out: 0 }]),
  )

  for (const t of filtered) {
    const amountBOB = convertToBOB(t.amount, t.currency)
    const acc = accounts.find((a) => a.id === t.account_id)
    if (!acc || amountBOB <= 0) continue
    if (t.type === 'SAVING') continue

    const flow = accountFlows.get(acc.id) ?? { in: 0, out: 0 }
    const accIdx = getNodeIndex(`account::${acc.id}`, acc.name, 'account')
    const project = t.project_id ? projects.find((p) => p.id === t.project_id) : null

    if (t.type === 'INCOME') {
      flow.in += amountBOB
      accountFlows.set(acc.id, flow)
      if (project) {
        const label = `${project.icon ?? ''} ${project.name}`.trim()
        upsertLink(getNodeIndex(`income-project::${project.id}`, label, 'income', project.color), accIdx, amountBOB)
      } else {
        const cat = categories.find((c) => c.id === t.category_id)
        if (!cat) continue
        upsertLink(getNodeIndex(`income-cat::${cat.id}`, cat.name, 'income'), accIdx, amountBOB)
      }
    } else if (t.type === 'TRANSFER') {
      const dst = t.to_account_id ? accounts.find((a) => a.id === t.to_account_id) : null
      if (!dst) continue
      const transferAmount = t.converted_amount && t.to_currency
        ? convertToBOB(t.converted_amount, t.to_currency)
        : amountBOB
      if (transferAmount <= 0) continue

      flow.out += transferAmount
      accountFlows.set(acc.id, flow)

      const transferIdx = getNodeIndex('transfer::all', 'Transferencias', 'transfer')
      const destLabel = `${dst.name}${t.to_currency && t.to_currency !== t.currency ? ` (${t.to_currency})` : ''}`
      const node = nodes[transferIdx]
      node.breakdown ??= {}
      node.breakdown[destLabel] = (node.breakdown[destLabel] || 0) + transferAmount
      links.push({ source: accIdx, target: transferIdx, value: transferAmount, stroke: NODE_COLORS.transfer })
    } else if (t.type === 'EXPENSE') {
      flow.out += amountBOB
      accountFlows.set(acc.id, flow)

      if (project) {
        const label = `${project.icon ?? ''} ${project.name}`.trim()
        const dstIdx = getNodeIndex(`expense-project::${project.id}`, label, 'expense', project.color)
        const node = nodes[dstIdx]
        node.breakdown ??= {}
        const sub = t.subtype || 'General'
        node.breakdown[sub] = (node.breakdown[sub] || 0) + amountBOB
        upsertLink(accIdx, dstIdx, amountBOB)
      } else {
        const cat = categories.find((c) => c.id === t.category_id)
        if (!cat) continue
        const dstIdx = getNodeIndex(`expense-cat::${cat.id}`, cat.name, 'expense')
        const node = nodes[dstIdx]
        node.breakdown ??= {}
        node.breakdown[t.tag || 'General'] = (node.breakdown[t.tag || 'General'] || 0) + amountBOB
        upsertLink(accIdx, dstIdx, amountBOB)
      }
    }
  }

  for (const [accountId, flow] of accountFlows) {
    const acc = accounts.find((a) => a.id === accountId)
    if (!acc || (flow.in === 0 && flow.out === 0)) continue
    const diff = flow.in - flow.out
    const accIdx = getNodeIndex(`account::${acc.id}`, acc.name, 'account')
    if (diff > 0) {
      upsertLink(accIdx, getNodeIndex('balance::saving', 'Ahorro/Excedente', 'balance'), diff)
    } else if (diff < 0) {
      upsertLink(getNodeIndex('balance::prev', 'Fondos Previos', 'balance'), accIdx, Math.abs(diff))
    }
  }

  return { nodes, links }
}