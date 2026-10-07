'use client'

import { useSyncExternalStore } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts'
import { useBalanceProjection } from '../hooks/useBalanceProjection'
import { formatCurrency } from '@/features/accounts/utils/account-display.utils'
import { ChartTooltipContainer } from '@/components/ui/chart-tooltip'
import { AlertTriangle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProjectedDay } from '@/lib/forecast/projection'

/** Paleta de datos §11 — neutros zinc + un único acento emerald. */
const INK = '#18181b' // zinc-900 · línea proyectada
const MUTED = '#71717a' // zinc-500 · labels
const FAINT = '#a1a1aa' // zinc-400 · helpers
const GRID = '#e4e4e7' // zinc-200
const ACCENT = '#059669' // emerald-600 · único acento, positivo

const CONFIDENCE_LABEL: Record<'high' | 'medium' | 'low', string> = {
  high: 'Alta confianza',
  medium: 'Confianza media',
  low: 'Estimación',
}

/** "1,5k" / "12,3k" — Intl compact mezcla mayúsculas ("1,5 K"), lo normalizamos. */
function formatCompactAmount(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs >= 1000) {
    return `${sign}${new Intl.NumberFormat('es-BO', { maximumFractionDigits: 1 }).format(abs / 1000)}k`
  }
  return `${sign}${new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }).format(abs)}`
}

function reducedMotionQuery(): MediaQueryList | null {
  return typeof window === 'undefined' ? null : window.matchMedia('(prefers-reduced-motion: reduce)')
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const query = reducedMotionQuery()
  if (!query) return () => {}
  query.addEventListener('change', onStoreChange)
  return () => query.removeEventListener('change', onStoreChange)
}

function getReducedMotion() {
  return reducedMotionQuery()?.matches ?? false
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false)
}

function ProjectionSkeleton() {
  return (
    <div className="bg-white rounded-[22px] border border-zinc-200 p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-lg bg-zinc-100" />
          <Skeleton className="h-3 w-24 rounded-lg bg-zinc-100" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full bg-zinc-100" />
      </div>
      <Skeleton className="mt-5 h-9 w-40 rounded-lg bg-zinc-100" />
      <Skeleton className="mt-4 h-14 w-full rounded-xl bg-zinc-100" />
      <Skeleton className="mt-5 h-[168px] sm:h-[190px] w-full rounded-xl bg-zinc-100" />
      <div className="flex items-center gap-5 mt-5 pt-5 border-t border-zinc-100">
        <Skeleton className="h-3 w-14 rounded-full bg-zinc-100" />
        <Skeleton className="h-3 w-24 rounded-full bg-zinc-100" />
      </div>
    </div>
  )
}

function ProjectionEmpty() {
  return (
    <div className="bg-white rounded-[22px] border border-zinc-200 p-6 flex flex-col items-center justify-center gap-3 min-h-[260px]">
      <div className="size-11 rounded-xl bg-zinc-100 flex items-center justify-center">
        <div className="size-2.5 rounded-full bg-zinc-300" />
      </div>
      <p className="text-sm font-medium text-zinc-900 tracking-tight">Sin cuentas registradas</p>
      <p className="text-xs text-zinc-500 max-w-[30ch] text-center leading-relaxed">
        Crea una cuenta para proyectar tu saldo día a día hasta fin de mes.
      </p>
    </div>
  )
}

interface TooltipEntry {
  payload?: ProjectedDay
}

function ProjectionTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}) {
  if (!active || !payload?.length || !label) return null

  const point = payload[0]?.payload
  const balance = point?.balance
  if (typeof balance !== 'number') return null

  const isToday = point ? !point.is_estimated : false
  const hasFlow = point ? point.income > 0 || point.expense > 0 : false

  return (
    <ChartTooltipContainer active={active} payload={payload}>
      <p className="text-xs font-semibold text-zinc-900 tracking-tight">
        {format(parseISO(label), "d 'de' MMMM", { locale: es })}
      </p>
      <div className="mt-2 flex items-center justify-between gap-6">
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          {/* El color nunca es el único portador de significado: el punto acompaña a la etiqueta. */}
          <span
            className="size-2 rounded-full shrink-0"
            style={{ backgroundColor: balance >= 0 ? ACCENT : FAINT }}
          />
          {isToday ? 'Saldo actual' : 'Saldo proyectado'}
        </span>
        <span className="text-sm font-bold tabular-nums text-zinc-900">
          {formatCurrency(balance, 'BOB')}
        </span>
      </div>
      {balance < 0 && (
        <p className="mt-1.5 text-[11px] text-zinc-500">Saldo negativo</p>
      )}
      {hasFlow && (
        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-col gap-1.5">
          {point!.income > 0 && (
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs text-zinc-500">Ingreso estimado</span>
              <span className="text-xs font-medium tabular-nums text-zinc-900">
                {formatCurrency(point!.income, 'BOB')}
              </span>
            </div>
          )}
          {point!.expense > 0 && (
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs text-zinc-500">Gasto estimado</span>
              <span className="text-xs font-medium tabular-nums text-zinc-900">
                {formatCurrency(point!.expense, 'BOB')}
              </span>
            </div>
          )}
        </div>
      )}
    </ChartTooltipContainer>
  )
}

function computeChartLayout(days: ProjectedDay[], firstNegativeDate: string | null) {
  const balances = days.map((d) => d.balance)
  const minBalance = Math.min(...balances)
  const maxBalance = Math.max(...balances)
  const padding = Math.max((maxBalance - minBalance) * 0.2, 100)

  return {
    yMin: Math.min(minBalance - padding, -padding),
    yMax: maxBalance + padding,
    hasNegativeZone: firstNegativeDate !== null,
    startNegativeIndex: firstNegativeDate !== null ? days.findIndex((d) => d.date === firstNegativeDate) : -1,
  }
}

export function BalanceProjection() {
  const { days, first_negative_date, final_balance, confidence, isLoading, hasData } = useBalanceProjection()
  const reduceMotion = usePrefersReducedMotion()

  if (isLoading) return <ProjectionSkeleton />
  if (!hasData || days.length === 0) return <ProjectionEmpty />

  const today = days[0]
  const endOfMonth = days[days.length - 1]
  const { yMin, yMax, hasNegativeZone, startNegativeIndex } = computeChartLayout(days, first_negative_date)

  // Solo el día de hoy es real (is_estimated = false para i === 0); el resto es proyección.
  // Por eso el ancla real se dibuja como punto y la trayectoria como línea trazada.
  const chartData = days.map((day, index) => ({
    ...day,
    balanceReal: index === 0 ? day.balance : null,
    balanceProyectado: index === 0 ? null : day.balance,
  }))

  const periodLabel = `${format(parseISO(today.date), 'd', { locale: es })} – ${format(
    parseISO(endOfMonth.date),
    "d 'de' MMM",
    { locale: es },
  )}`

  const negativeLabel = first_negative_date
    ? format(parseISO(first_negative_date), "d 'de' MMM", { locale: es })
    : null

  const chartDescription = [
    `Proyección de saldo del ${periodLabel}.`,
    `Saldo hoy ${formatCurrency(today.balance, 'BOB')}.`,
    `Proyección a fin de mes ${formatCurrency(final_balance, 'BOB')}.`,
    negativeLabel ? `Se proyecta saldo negativo el ${negativeLabel}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="bg-white rounded-[22px] border border-zinc-200 p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-zinc-900 tracking-tight">Proyección de saldo</h3>
          <p className="text-xs text-zinc-500 mt-1 capitalize">{periodLabel}</p>
        </div>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 whitespace-nowrap">
          {CONFIDENCE_LABEL[confidence]}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium text-zinc-600">Saldo hoy</p>
        <p className="mt-1 text-[28px] leading-none sm:text-3xl font-bold tracking-tight tabular-nums text-zinc-900">
          {formatCurrency(today.balance, 'BOB')}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-zinc-100/70 px-3.5 py-2.5">
        <p className="min-w-0 text-[11px] text-zinc-500 truncate">
          Proyección a fin de mes
        </p>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">
          {formatCurrency(final_balance, 'BOB')}
        </p>
      </div>

      {first_negative_date && negativeLabel && (
        <div className="mt-4 rounded-xl bg-zinc-50 border border-zinc-200 p-3.5 flex items-start gap-3">
          <AlertTriangle aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5 text-zinc-900" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 tracking-tight">Saldo negativo proyectado</p>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Se proyecta que tu saldo llegue a negativo el {negativeLabel}.
              {confidence !== 'low' && ' Revisa tus gastos recurrentes para ajustarla.'}
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50/50 p-2 overflow-hidden">
        <div
          className="h-[168px] sm:h-[190px] w-full"
          role="img"
          aria-label={chartDescription}
        >
          <div className="h-full w-full" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceProy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={INK} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={INK} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => format(parseISO(value), 'd', { locale: es })}
                  tick={{ fontSize: 10, fill: MUTED }}
                  interval="preserveStartEnd"
                  minTickGap={16}
                  tickMargin={8}
                  axisLine={false}
                  tickLine={false}
                  dy={4}
                />
                <YAxis
                  width={38}
                  domain={[yMin, yMax]}
                  tickFormatter={formatCompactAmount}
                  tick={{ fontSize: 10, fill: FAINT }}
                  tickCount={4}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<ProjectionTooltip />}
                  cursor={{ stroke: FAINT, strokeWidth: 1, strokeDasharray: '3 3' }}
                />

                {hasNegativeZone && startNegativeIndex > 0 && (
                  <ReferenceArea
                    x1={days[startNegativeIndex].date}
                    x2={endOfMonth.date}
                    fill={INK}
                    fillOpacity={0.05}
                  />
                )}

                <ReferenceLine
                  y={0}
                  stroke={FAINT}
                  strokeDasharray="3 3"
                  label={{ value: '0', position: 'insideTopLeft', fill: FAINT, fontSize: 9 }}
                />

                {hasNegativeZone && startNegativeIndex > 0 && (
                  <ReferenceLine
                    x={days[startNegativeIndex].date}
                    stroke={FAINT}
                    strokeDasharray="3 3"
                    label={{
                      value: 'sala a negativo',
                      position: 'insideTopRight',
                      fill: MUTED,
                      fontSize: 9,
                    }}
                  />
                )}

                {/* Ancla real: un único día medido, por eso punto y no segmento. */}
                <Area
                  type="monotone"
                  dataKey="balanceReal"
                  stroke="none"
                  fill="none"
                  dot={{ r: 4, fill: ACCENT, stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 4, fill: ACCENT, stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />

                {/* Trayectoria estimada: estilo de línea, no solo color. */}
                <Area
                  type="monotone"
                  dataKey="balanceProyectado"
                  stroke={INK}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  fill="url(#balanceProy)"
                  dot={false}
                  activeDot={{ r: 4, fill: INK, stroke: '#ffffff', strokeWidth: 2 }}
                  connectNulls
                  animationDuration={reduceMotion ? 0 : 900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-zinc-100">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: ACCENT }} />
            <span className="text-xs font-medium text-zinc-600">Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="w-4 h-0 border-t-2 border-dashed shrink-0"
              style={{ borderColor: INK }}
            />
            <span className="text-xs font-medium text-zinc-600">Proyectado</span>
          </div>
        </div>
        <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
          Proyecta tu saldo actual con ingresos y gastos recurrentes. El tramo punteado es estimado.
        </p>
      </div>
    </div>
  )
}