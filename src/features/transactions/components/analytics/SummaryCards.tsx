// features/transactions/components/analytics/SummaryCards.tsx
"use client"

import { useMemo } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import dynamic from "next/dynamic"

const SparklineChart = dynamic(
  () => import("./SparklineChart").then(m => m.SparklineChart),
  { ssr: false }
)

import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { filterByPeriod, getPreviousPeriod, getDaysInPeriod, parseLocalDate } from "@/utils/date.utils"
import { format } from "date-fns"
import type { Period } from "@/types/period"
import type { Transaction } from "@/types/transaction"
import type { Project } from "@/types/project"

interface SparkPoint { value: number }

// ─── Helpers (sin cambios) ────────────────────────────────────────────────────
function buildSparkline(
  transactions: Transaction[],
  period: Period,
  type: 'income' | 'expense' | 'net'
): SparkPoint[] {
  const days     = getDaysInPeriod(period)
  const filtered = filterByPeriod(transactions, period)
  const byDay    = new Map<string, { income: number; expense: number }>()
  days.forEach((d) => byDay.set(d, { income: 0, expense: 0 }))

  filtered.forEach((t) => {
    const dateStr = format(parseLocalDate(t.date), 'yyyy-MM-dd')
    const entry   = byDay.get(dateStr)
    if (!entry) return
    if (t.type === 'INCOME')  entry.income  += t.amount
    if (t.type === 'EXPENSE') entry.expense += t.amount
  })

  let cumulative = 0
  return days.map((d) => {
    const entry = byDay.get(d)!
    if (type === 'income')  cumulative += entry.income
    if (type === 'expense') cumulative += entry.expense
    if (type === 'net')     cumulative += entry.income - entry.expense
    return { value: cumulative }
  })
}

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// ─── TrendBadge (sin cambios) ─────────────────────────────────────────────────
function TrendBadge({ trend, inverse = false }: { trend: number; inverse?: boolean }) {
  const isPositive = inverse ? trend < 0 : trend > 0
  const isNeutral  = trend === 0
  if (isNeutral) {
    return (
      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
        <Minus className="w-3 h-3" /><span>Sin cambio</span>
      </div>
    )
  }
  return (
    <div className={cn('flex items-center gap-1 text-[11px] font-medium', isPositive ? 'text-emerald-600' : 'text-rose-500')}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs anterior</span>
    </div>
  )
}

// ─── SummaryCard principal (sin cambios) ──────────────────────────────────────
function SummaryCard({
  title, amount, currency, trend, sparkData, sparkColor, amountColor, inversetrend = false,
}: {
  title: string; amount: number; currency: string; trend: number
  sparkData: SparkPoint[]; sparkColor: string; amountColor?: string; inversetrend?: boolean
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col gap-3 overflow-hidden relative"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-gray-500">{title}</p>
      </div>
      <div>
        <p className={cn('text-2xl font-semibold tracking-tight', amountColor ?? 'text-gray-900')}>
          {formatCurrency(Math.abs(amount), currency)}
        </p>
        <div className="mt-1">
          <TrendBadge trend={trend} inverse={inversetrend} />
        </div>
      </div>
      <div className="h-[52px] -mx-5 -mb-5 mt-auto">
        <SparklineChart data={sparkData} color={sparkColor} />
      </div>
    </div>
  )
}

// ─── ProjectCard — nueva ──────────────────────────────────────────────────────
function ProjectSummaryCard({
  project,
  income,
  expenses,
  currency,
}: {
  project:  Project | null   // null = Personal
  income:   number
  expenses: number
  currency: string
}) {
  const net          = income - expenses
  const isPersonal   = project === null
  const color        = isPersonal ? '#9ca3af' : project.color
  const icon         = isPersonal ? '👤' : (project.icon ?? '📁')
  const name         = isPersonal ? 'Personal' : project.name
  const colorBg      = `${color}06`
  const colorBorder  = `${color}20`
  const colorDivider = `${color}20`

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        backgroundColor: colorBg,
        border:          `0.5px solid ${colorBorder}`,
        borderLeft:      `3px solid ${color}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 18 }}>{icon}</span>
        <p className="text-[13px] font-semibold" style={{ color }}>
          {name}
        </p>
      </div>

      {/* Ingresos + Gastos */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-gray-400">Ingresos</span>
          <span className="text-[13px] font-medium text-emerald-600">
            {formatCurrency(income, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-gray-400">Gastos</span>
          <span className="text-[13px] font-medium text-rose-500">
            {formatCurrency(expenses, currency)}
          </span>
        </div>
      </div>

      {/* Neto */}
      <div
        className="flex items-center justify-between pt-3 mt-auto"
        style={{ borderTop: `0.5px solid ${colorDivider}` }}
      >
        <span className="text-[12px] text-gray-400">Neto</span>
        <span
          className="text-[15px] font-semibold"
          style={{ color: net >= 0 ? '#16a34a' : '#e11d48' }}
        >
          {net >= 0 ? '+' : ''}{formatCurrency(net, currency)}
        </span>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
interface SummaryCardsProps {
  transactions: Transaction[]
  period:       Period
  projects:     Project[]      // ← NUEVO
  currency?:    string
}

export function SummaryCards({
  transactions,
  period,
  projects,
  currency = 'BOB',
}: SummaryCardsProps) {
  const prevPeriod = useMemo(() => getPreviousPeriod(period), [period])

  // ── Totales del período actual ───────────────────────────────────────────────
  const current = useMemo(() => {
    const filtered = filterByPeriod(transactions, period)
    const income   = filtered.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
    const expense  = filtered.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
    return { income, expense, net: income - expense }
  }, [transactions, period])

  // ── Totales del período anterior ─────────────────────────────────────────────
  const previous = useMemo(() => {
    const filtered = filterByPeriod(transactions, prevPeriod)
    const income   = filtered.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
    const expense  = filtered.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
    return { income, expense, net: income - expense }
  }, [transactions, prevPeriod])

  // ── P&L por proyecto ─────────────────────────────────────────────────────────
  const projectStats = useMemo(() => {
    const filtered = filterByPeriod(transactions, period)

    // Mapa projectId → { income, expense }
    // null = personal
    const map = new Map<string | null, { income: number; expense: number }>()
    map.set(null, { income: 0, expense: 0 })
    projects.forEach((p) => map.set(p.id, { income: 0, expense: 0 }))

    filtered.forEach((t) => {
      const key = t.project_id ?? null
      // Si el proyecto fue archivado y no está en la lista, igual lo contamos como personal
      const entry = map.get(key) ?? map.get(null)!
      if (t.type === 'INCOME')  entry.income  += t.amount
      if (t.type === 'EXPENSE') entry.expense += t.amount
    })

    return map
  }, [transactions, period, projects])

  // ── Sparklines ───────────────────────────────────────────────────────────────
  const incomeSpark  = useMemo(() => buildSparkline(transactions, period, 'income'),  [transactions, period])
  const expenseSpark = useMemo(() => buildSparkline(transactions, period, 'expense'), [transactions, period])
  const netSpark     = useMemo(() => buildSparkline(transactions, period, 'net'),     [transactions, period])

  // ── Tendencias ───────────────────────────────────────────────────────────────
  const incomeTrend  = calcTrend(current.income,  previous.income)
  const expenseTrend = calcTrend(current.expense, previous.expense)
  const netTrend     = calcTrend(current.net,     previous.net)

  const netColor = current.net > 0 ? 'text-emerald-600' : current.net < 0 ? 'text-rose-500' : 'text-gray-900'

  // ── Proyectos con actividad en el período ─────────────────────────────────
  // Solo mostrar cards de proyectos que tienen al menos una transacción
  const activeProjects = projects.filter((p) => {
    const stats = projectStats.get(p.id)
    return stats && (stats.income > 0 || stats.expense > 0)
  })

  const hasProjectCards = activeProjects.length > 0

  return (
    <div className="space-y-4 mb-6">

      {/* ── Fila 1: cards de totales (sin cambios) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Ingresos"
          amount={current.income}
          currency={currency}
          trend={incomeTrend}
          sparkData={incomeSpark}
          sparkColor="#34d399"
        />
        <SummaryCard
          title="Gastos"
          amount={current.expense}
          currency={currency}
          trend={expenseTrend}
          sparkData={expenseSpark}
          sparkColor="#fb7185"
          inversetrend
        />
        <SummaryCard
          title="Balance neto"
          amount={current.net}
          currency={currency}
          trend={netTrend}
          sparkData={netSpark}
          sparkColor={current.net >= 0 ? '#34d399' : '#fb7185'}
          amountColor={netColor}
        />
      </div>

      {/* ── Fila 2: cards por proyecto — solo si hay actividad ── */}
      {hasProjectCards && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

          {/* Card por cada proyecto activo en el período */}
          {activeProjects.map((project) => {
            const stats = projectStats.get(project.id)!
            return (
              <ProjectSummaryCard
                key={project.id}
                project={project}
                income={stats.income}
                expenses={stats.expense}
                currency={currency}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}