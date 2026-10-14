// scripts/verify-metrics-equivalence.ts
// Comprueba que la extracción de los cálculos a `src/lib/metrics/` no cambió
// ninguna cifra.
//
// Esta migración mueve lógica de los hooks (`useFinancialMetrics`,
// `useCashflowData`, `useBudgets`) a funciones puras compartidas por servidor y
// cliente. El riesgo real no es que el servidor calcule distinto — comparte las
// mismas funciones, así que eso es imposible por construcción — sino que al
// EXTRAERlas se haya alterado una regla de negocio y las cifras del usuario
// cambien en silencio.
//
// Por eso la referencia contra la que se compara es el cálculo ORIGINAL,
// copiado literalmente de los hooks, y no otra versión nueva.
//
// Uso: npx tsx scripts/verify-metrics-equivalence.ts <userId>

import 'dotenv/config'
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

import { transactionsRepository } from '../src/repositories/transactions.repository'
import { accountsRepository } from '../src/repositories/accounts.repository'
import { categoriesRepository } from '../src/repositories/categories.repository'
import { projectRepository } from '../src/repositories/project.repository'
import { budgetRepository } from '../src/repositories/budget.repository'
import { refreshRates, convertToBOB } from '../src/lib/config/exchange-rates'
import { calcBudgetProgress } from '../src/lib/metrics/budget-progress'
import {
  buildSankeyData,
  computeChartData,
  computeComparisonData,
  computeCumulativeByDay,
  computeFullStats,
  computeStats,
  computeTrends,
} from '../src/lib/metrics/dashboard-metrics'
import { parseLocalDate } from '../src/utils/date.utils'

/* eslint-disable @typescript-eslint/no-explicit-any -- la implementación de
   REFERENCIA está copiada literalmente de los hooks originales, conservando su
   tipado laxo. Endurecerlo aquí falsearía la comparación contra el código que
   se quiere verificar. */

import type { BudgetProgress } from '../src/types/budget'
import type { Transaction } from '../src/types/transaction'

const EPS = 0.01
const ymd = (d: Date) => format(d, 'yyyy-MM-dd')
const failures: string[] = []
const compare = (label: string, a: number, b: number) => {
  if (Math.abs(a - b) > EPS) failures.push(`${label}: nuevo=${a} original=${b} (Δ=${(a - b).toFixed(4)})`)
}

// ═══ REFERENCIA ORIGINAL — copiada de los hooks, sin modificar ═══════════════

/** useFinancialMetrics.ts:25-46 */
function legacyStats(list: Transaction[]) {
  const income = list.filter((t) => t.type === 'INCOME').reduce((s, t) => s + convertToBOB(t.amount, t.currency), 0)
  const expense = list.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + convertToBOB(t.amount, t.currency), 0)
  const fixedExpense = list.filter((t) => t.type === 'EXPENSE' && t.is_recurring).reduce((s, t) => s + convertToBOB(t.amount, t.currency), 0)
  return { income, expense, net: income - expense, fixedExpense, variableExpense: expense - fixedExpense }
}

/** useFinancialMetrics.ts:58-103 */
function legacyCumulative(list: Transaction[], days: string[]) {
  return days.reduce<{ expense: number; income: number }[]>((acc, dateStr) => {
    const dayTx = list.filter((t) => t.date.startsWith(dateStr))
    const dayExpense = dayTx.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + convertToBOB(t.amount, t.currency), 0)
    const dayIncome = dayTx.filter((t) => t.type === 'INCOME').reduce((s, t) => s + convertToBOB(t.amount, t.currency), 0)
    const prev = acc.length > 0 ? acc[acc.length - 1] : { expense: 0, income: 0 }
    acc.push({ expense: prev.expense + dayExpense, income: prev.income + dayIncome })
    return acc
  }, [])
}

/** useFinancialMetrics.ts:92-100 */
function legacyComparison(current: { expense: number; income: number }[], previous: { expense: number; income: number }[]) {
  const maxDays = Math.max(current.length, previous.length)
  const out: any[] = []
  for (let i = 0; i < maxDays; i++) {
    out.push({
      day: i + 1,
      currentExpense: i < current.length ? current[i].expense : null,
      currentIncome: i < current.length ? current[i].income : null,
      previousExpense: i < previous.length ? previous[i].expense : previous[previous.length - 1].expense,
      previousIncome: i < previous.length ? previous[i].income : previous[previous.length - 1].income,
    })
  }
  return out
}

/** useFinancialMetrics.ts:106-134 */
function legacyChart(list: Transaction[], days: string[]) {
  const map = new Map<string, any>()
  days.forEach((d) => map.set(d, { date: d, income: 0, expense: 0, label: format(parseLocalDate(d), 'd MMM', { locale: es }) }))
  list.forEach((t) => {
    const e = map.get(t.date)
    if (!e) return
    const v = convertToBOB(t.amount, t.currency)
    if (t.type === 'INCOME') { e.income += v; e.incomeByCurrency ??= {}; e.incomeByCurrency[t.currency] = (e.incomeByCurrency[t.currency] ?? 0) + t.amount }
    if (t.type === 'EXPENSE') { e.expense += v; e.expenseByCurrency ??= {}; e.expenseByCurrency[t.currency] = (e.expenseByCurrency[t.currency] ?? 0) + t.amount }
  })
  return Array.from(map.values())
}

/** useBudgets.ts calcProgress — versión original */
function legacyBudget(budget: any, transactions: Transaction[]): BudgetProgress {
  const now = new Date()
  const currentMonth = format(now, 'yyyy-MM')
  const linked = transactions.filter((t) => {
    if (t.date.slice(0, 7) !== currentMonth) return false
    if (budget.project_id) {
      if (t.project_id !== budget.project_id) return false
      if (budget.subtypes && budget.subtypes.length > 0) { if (!t.subtype || !budget.subtypes.includes(t.subtype)) return false }
      if (budget.type === 'INCOME_SOURCE') return t.type === 'INCOME'
      if (budget.type === 'FIXED_EXPENSE') return t.type === 'EXPENSE'
      if (budget.type === 'SAVINGS_GOAL') return t.type === 'INCOME'
      return false
    }
    if (!t.category_id || !budget.category_ids.includes(t.category_id)) return false
    if (budget.type === 'INCOME_SOURCE') return t.type === 'INCOME'
    if (budget.type === 'FIXED_EXPENSE') return t.type === 'EXPENSE'
    if (budget.type === 'SAVINGS_GOAL') return t.type === 'INCOME'
    return false
  })
  const current_amount = linked.reduce((s, t) => s + convertToBOB(t.amount, t.currency), 0)
  const percent = Math.min((current_amount / budget.target_amount) * 100, 100)
  let days_until_due: number | null = null
  let is_overdue = false
  if (budget.due_day) {
    const dueDate = new Date(now.getFullYear(), now.getMonth(), budget.due_day)
    days_until_due = Math.ceil((startOfDay(dueDate).getTime() - startOfDay(now).getTime()) / (1000 * 60 * 60 * 24))
    is_overdue = days_until_due < 0 && percent < 100
  }
  let status: BudgetProgress['status']
  if (percent >= 100) status = 'COMPLETED'
  else if (is_overdue) status = 'OVERDUE'
  else if (budget.due_day) {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    status = now.getDate() > daysInMonth / 2 && percent < 50 ? 'AT_RISK' : 'ON_TRACK'
  } else status = 'ON_TRACK'
  return { budget, current_amount, target_amount: budget.target_amount, percent, remaining: budget.target_amount - current_amount, days_until_due, is_overdue, status }
}


/** useCashflowData.ts buildSankeyData — versión original */
function legacySankey(transactions: Transaction[], categories: any[], accounts: any[], projects: any[], from: string, to: string) {
  const COLORS: Record<string, string> = {
    income: '#059669', expense: '#27272a', account: '#e4e4e7',
    balance: '#18181b', project: '#059669', subtype: '#27272a', transfer: '#a1a1aa',
  }
  const filtered = transactions.filter((t) => t.date >= from && t.date <= to)
  const nodeMap = new Map<string, number>()
  const nodes: any[] = []
  const getNodeIndex = (key: string, name: string, type?: any, color?: string): number => {
    if (!nodeMap.has(key)) {
      nodeMap.set(key, nodes.length)
      nodes.push({ name, type, color: color ?? (type ? COLORS[type] : '#3B82F6') })
    }
    return nodeMap.get(key)!
  }
  const links: any[] = []
  const upsertLink = (source: number, target: number, value: number) => {
    if (value <= 0 || source === target) return
    const ex = links.find((l) => l.source === source && l.target === target)
    if (ex) ex.value += value
    else links.push({ source, target, value })
  }
  const flows = new Map<string, { in: number; out: number }>(accounts.map((a) => [a.id, { in: 0, out: 0 }]))

  filtered.forEach((t) => {
    const amountBOB = convertToBOB(t.amount, t.currency)
    const acc = accounts.find((a) => a.id === t.account_id)
    if (!acc || amountBOB <= 0) return
    if (t.type === 'SAVING') return
    const flow = flows.get(acc.id) ?? { in: 0, out: 0 }
    const accIdx = getNodeIndex(`account::${acc.id}`, acc.name, 'account')
    const project = t.project_id ? projects.find((p: any) => p.id === t.project_id) : null

    if (t.type === 'INCOME') {
      flow.in += amountBOB; flows.set(acc.id, flow)
      if (project) {
        const label = `${project.icon ?? ''} ${project.name}`.trim()
        upsertLink(getNodeIndex(`income-project::${project.id}`, label, 'income', project.color), accIdx, amountBOB)
      } else {
        const cat = categories.find((c) => c.id === t.category_id)
        if (!cat) return
        upsertLink(getNodeIndex(`income-cat::${cat.id}`, cat.name, 'income'), accIdx, amountBOB)
      }
    } else if (t.type === 'TRANSFER') {
      const dst = t.to_account_id ? accounts.find((a) => a.id === t.to_account_id) : null
      if (!dst) return
      const transferAmount = t.converted_amount && t.to_currency ? convertToBOB(t.converted_amount, t.to_currency) : amountBOB
      if (transferAmount <= 0) return
      flow.out += transferAmount; flows.set(acc.id, flow)
      const ti = getNodeIndex('transfer::all', 'Transferencias', 'transfer')
      const destLabel = `${dst.name}${t.to_currency && t.to_currency !== t.currency ? ` (${t.to_currency})` : ''}`
      const node = nodes[ti]
      if (!node.breakdown) node.breakdown = {}
      node.breakdown[destLabel] = (node.breakdown[destLabel] || 0) + transferAmount
      links.push({ source: accIdx, target: ti, value: transferAmount, stroke: COLORS.transfer })
    } else if (t.type === 'EXPENSE') {
      flow.out += amountBOB; flows.set(acc.id, flow)
      if (project) {
        const label = `${project.icon ?? ''} ${project.name}`.trim()
        const di = getNodeIndex(`expense-project::${project.id}`, label, 'expense', project.color)
        const node = nodes[di]
        if (!node.breakdown) node.breakdown = {}
        node.breakdown[t.subtype || 'General'] = (node.breakdown[t.subtype || 'General'] || 0) + amountBOB
        upsertLink(accIdx, di, amountBOB)
      } else {
        const cat = categories.find((c) => c.id === t.category_id)
        if (!cat) return
        const di = getNodeIndex(`expense-cat::${cat.id}`, cat.name, 'expense')
        const node = nodes[di]
        if (!node.breakdown) node.breakdown = {}
        node.breakdown[t.tag || 'General'] = (node.breakdown[t.tag || 'General'] || 0) + amountBOB
        upsertLink(accIdx, di, amountBOB)
      }
    }
  })

  flows.forEach((flow, accountId) => {
    const acc = accounts.find((a) => a.id === accountId)
    if (!acc || (flow.in === 0 && flow.out === 0)) return
    const diff = flow.in - flow.out
    const accIdx = getNodeIndex(`account::${acc.id}`, acc.name, 'account')
    if (diff > 0) upsertLink(accIdx, getNodeIndex('balance::saving', 'Ahorro/Excedente', 'balance'), diff)
    else if (diff < 0) upsertLink(getNodeIndex('balance::prev', 'Fondos Previos', 'balance'), accIdx, Math.abs(diff))
  })

  return { nodes, links }
}

// ═══ FIN REFERENCIA ORIGINAL ═════════════════════════════════════════════════

async function main() {
  const userId = process.argv[2]
  if (!userId) { console.error('Uso: npx tsx scripts/verify-metrics-equivalence.ts <userId>'); process.exit(1) }

  await refreshRates()
  const [all, accounts, categories, projects, budgets] = await Promise.all([
    transactionsRepository.findAll(userId),
    accountsRepository.findAll(userId),
    categoriesRepository.findAll(userId),
    projectRepository.findAll(userId),
    budgetRepository.findAll(userId),
  ])

  const now = new Date()
  const cFrom = ymd(startOfMonth(now)), cTo = ymd(endOfMonth(now))
  const pFrom = ymd(startOfMonth(subMonths(now, 1))), pTo = ymd(endOfMonth(subMonths(now, 1)))
  const cur = all.filter((t) => t.status === 'COMPLETED' && t.date >= cFrom && t.date <= cTo)
  const prv = all.filter((t) => t.status === 'COMPLETED' && t.date >= pFrom && t.date <= pTo)
  const cDays = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }).map(ymd)
  const pDays = eachDayOfInterval({ start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }).map(ymd)

  // ── Totales del mes ──
  const nS = computeFullStats(cur), lS = legacyStats(cur)
  compare('mes.income', nS.income, lS.income)
  compare('mes.expense', nS.expense, lS.expense)
  compare('mes.net', nS.net, lS.net)
  compare('mes.fixedExpense', nS.fixedExpense!, lS.fixedExpense)
  compare('mes.variableExpense', nS.variableExpense!, lS.variableExpense)

  const nP = computeStats(prv), lP = legacyStats(prv)
  compare('mesAnt.income', nP.income, lP.income)
  compare('mesAnt.expense', nP.expense, lP.expense)
  compare('mesAnt.net', nP.net, lP.net)

  const t = computeTrends(nS, nP)
  const calc = (c: number, p: number) => (p === 0 ? (c > 0 ? 100 : 0) : ((c - p) / p) * 100)
  compare('trend.income', t.income, calc(lS.income, lP.income))
  compare('trend.expense', t.expense, calc(lS.expense, lP.expense))
  compare('trend.net', t.net, calc(lS.net, lP.net))

  // ── Series comparativas y gráfico diario ──
  const nCmp = computeComparisonData(computeCumulativeByDay(cur, cDays), computeCumulativeByDay(prv, pDays))
  const lCmp = legacyComparison(legacyCumulative(cur, cDays), legacyCumulative(prv, pDays))
  if (nCmp.length !== lCmp.length) failures.push(`comparación: filas nuevo=${nCmp.length} original=${lCmp.length}`)
  nCmp.forEach((d, i) => {
    const l = lCmp[i]; if (!l) return
    for (const k of ['currentExpense', 'currentIncome', 'previousExpense', 'previousIncome'] as const) {
      const a = d[k] ?? 0, b = l[k] ?? 0
      compare(`comparación[${i}].${k}`, a, b)
    }
  })

  const nCh = computeChartData(cur, cDays, (d) => format(parseLocalDate(d), 'd MMM', { locale: es }))
  const lCh = legacyChart(cur, cDays)
  if (nCh.length !== lCh.length) failures.push(`chartData: nuevo=${nCh.length} original=${lCh.length}`)
  nCh.forEach((d, i) => {
    const l = lCh[i]; if (!l) return
    compare(`chart[${d.date}].income`, d.income, l.income)
    compare(`chart[${d.date}].expense`, d.expense, l.expense)
    compare(`chart[${d.date}].label`, d.label === l.label ? 0 : 1, 0)
  })

  // ── Sankey ──
  const nSankey = buildSankeyData(cur, categories, accounts, projects, cFrom, cTo)
  const lS2 = legacySankey(cur, categories, accounts, projects, cFrom, cTo)
  if (nSankey.nodes.length !== lS2.nodes.length) {
    failures.push(`sankey nodos: nuevo=${nSankey.nodes.length} original=${lS2.nodes.length}`)
  } else {
    nSankey.nodes.forEach((nd, i) => {
      if (nd.name !== lS2.nodes[i].name) failures.push(`sankey nodo[${i}].name: nuevo="${nd.name}" original="${lS2.nodes[i].name}"`)
    })
  }
  if (nSankey.links.length !== lS2.links.length) {
    failures.push(`sankey enlaces: nuevo=${nSankey.links.length} original=${lS2.links.length}`)
  }
  nSankey.links.forEach((l, i) => {
    const o = lS2.links[i]
    if (!o) return
    if (l.source !== o.source || l.target !== o.target) {
      failures.push(`sankey enlace[${i}] topología: nuevo=${l.source}->${l.target} original=${o.source}->${o.target}`)
    }
    compare(`sankey enlace[${i}].value`, l.value, o.value)
  })

  // ── Presupuestos ──
  const active = budgets.filter((b) => b.is_active)
  active.forEach((b, i) => {
    const nb = calcBudgetProgress(b, all), lb = legacyBudget(b, all)
    compare(`presupuesto[${i}].current_amount`, nb.current_amount, lb.current_amount)
    compare(`presupuesto[${i}].percent`, nb.percent, lb.percent)
    compare(`presupuesto[${i}].remaining`, nb.remaining, lb.remaining)
    if (nb.status !== lb.status) failures.push(`presupuesto[${i}].status: nuevo=${nb.status} original=${lb.status}`)
    if (nb.days_until_due !== lb.days_until_due) failures.push(`presupuesto[${i}].days_until_due: nuevo=${nb.days_until_due} original=${lb.days_until_due}`)
  })

  console.log(`\n  usuario ${userId.slice(0, 8)}…`)
  console.log(`  historial completo: ${all.length} tx | periodo actual: ${cur.length} tx`)
  console.log(`  comparados: ${cDays.length} días, ${active.length} presupuestos, ${nSankey.nodes.length} nodos Sankey\n`)

  if (failures.length > 0) {
    console.error('✗ La extracción cambió el resultado:\n')
    failures.slice(0, 20).forEach((f) => console.error(`  - ${f}`))
    if (failures.length > 20) console.error(`  … y ${failures.length - 20} más`)
    console.error('')
    process.exit(1)
  }
  console.log('✓ La extracción a lib/metrics no alteró ninguna cifra.')
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })