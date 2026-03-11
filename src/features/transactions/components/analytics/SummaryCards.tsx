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

// ─── Sparkline data point ─────────────────────────────────────────────────────
interface SparkPoint {
  value: number
}

// ─── Calcular sparkline desde transacciones ───────────────────────────────────
function buildSparkline(
  transactions: Transaction[],
  period:       Period,
  type:         'income' | 'expense' | 'net'
): SparkPoint[] {
  const days    = getDaysInPeriod(period)
  const filtered = filterByPeriod(transactions, period)

  // Acumular por día
  const byDay = new Map<string, { income: number; expense: number }>()
  days.forEach((d) => byDay.set(d, { income: 0, expense: 0 }))

  filtered.forEach((t) => {
    const dateStr = format(parseLocalDate(t.date), 'yyyy-MM-dd')
    const entry   = byDay.get(dateStr)
    if (!entry) return
    if (t.type === 'INCOME')  entry.income  += t.amount
    if (t.type === 'EXPENSE') entry.expense += t.amount
  })

  // Acumulado progresivo para sparkline más legible
  let cumulative = 0
  return days.map((d) => {
    const entry = byDay.get(d)!
    if (type === 'income')  cumulative += entry.income
    if (type === 'expense') cumulative += entry.expense
    if (type === 'net')     cumulative += entry.income - entry.expense
    return { value: cumulative }
  })
}

// ─── Calcular tendencia ───────────────────────────────────────────────────────
function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// ─── Badge de tendencia ───────────────────────────────────────────────────────
function TrendBadge({ trend, inverse = false }: { trend: number; inverse?: boolean }) {
  const isPositive = inverse ? trend < 0 : trend > 0
  const isNeutral  = trend === 0

  if (isNeutral) {
    return (
      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
        <Minus className="w-3 h-3" />
        <span>Sin cambio</span>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex items-center gap-1 text-[11px] font-medium',
      isPositive ? 'text-emerald-600' : 'text-rose-500'
    )}>
      {isPositive
        ? <TrendingUp   className="w-3 h-3" />
        : <TrendingDown className="w-3 h-3" />
      }
      <span>
        {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs anterior
      </span>
    </div>
  )
}

// ─── Card individual ──────────────────────────────────────────────────────────
function SummaryCard({
  title,
  amount,
  currency,
  trend,
  sparkData,
  sparkColor,
  amountColor,
  inversetrend = false,
}: {
  title:        string
  amount:       number
  currency:     string
  trend:        number
  sparkData:    SparkPoint[]
  sparkColor:   string
  amountColor?: string
  inversetrend?: boolean
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col gap-3 overflow-hidden relative"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-gray-500">{title}</p>
      </div>

      {/* ── Monto principal ── */}
      <div>
        <p className={cn(
          'text-2xl font-semibold tracking-tight',
          amountColor ?? 'text-gray-900'
        )}>
          {formatCurrency(Math.abs(amount), currency)}
        </p>
        <div className="mt-1">
          <TrendBadge trend={trend} inverse={inversetrend} />
        </div>
      </div>

      {/* ── Sparkline ── */}
      <div className="h-[52px] -mx-5 -mb-5 mt-auto">
        <SparklineChart data={sparkData} color={sparkColor} />
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
interface SummaryCardsProps {
  transactions: Transaction[]
  period:       Period
  currency?:    string
}

export function SummaryCards({
  transactions,
  period,
  currency = 'BOB',
}: SummaryCardsProps) {
  const prevPeriod = useMemo(() => getPreviousPeriod(period), [period])

  // ── Transacciones del período actual ────────────────────────────────────────
  const current = useMemo(() => {
    const filtered = filterByPeriod(transactions, period)
    const income   = filtered
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense  = filtered
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)
    return { income, expense, net: income - expense }
  }, [transactions, period])

  // ── Transacciones del período anterior ─────────────────────────────────────
  const previous = useMemo(() => {
    const filtered = filterByPeriod(transactions, prevPeriod)
    const income   = filtered
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense  = filtered
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)
    return { income, expense, net: income - expense }
  }, [transactions, prevPeriod])

  // ── Sparklines ──────────────────────────────────────────────────────────────
  const incomeSpark  = useMemo(
    () => buildSparkline(transactions, period, 'income'),
    [transactions, period]
  )
  const expenseSpark = useMemo(
    () => buildSparkline(transactions, period, 'expense'),
    [transactions, period]
  )
  const netSpark     = useMemo(
    () => buildSparkline(transactions, period, 'net'),
    [transactions, period]
  )

  // ── Tendencias ──────────────────────────────────────────────────────────────
  const incomeTrend  = calcTrend(current.income,  previous.income)
  const expenseTrend = calcTrend(current.expense, previous.expense)
  const netTrend     = calcTrend(current.net,     previous.net)

  const netColor =
    current.net > 0 ? 'text-emerald-600' :
    current.net < 0 ? 'text-rose-500'    :
    'text-gray-900'

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
        inversetrend  // para gastos: bajar es bueno
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
  )
}