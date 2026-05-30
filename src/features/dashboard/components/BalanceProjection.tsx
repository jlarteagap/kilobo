'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts'
import { useBalanceProjection } from '../hooks/useBalanceProjection'
import { formatCurrency } from '@/features/accounts/utils/account-display.utils'
import { ChartTooltipContainer } from '@/components/ui/chart-tooltip'
import { TrendingUp, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProjectedDay } from '@/lib/forecast/projection'

function ProjectionSkeleton() {
  return (
    <div className="bg-card rounded-3xl p-6 border border-border/40">
      <div className="mb-6">
        <Skeleton className="h-4 w-36 rounded-full" />
        <Skeleton className="h-3 w-48 rounded-full mt-1.5" />
      </div>
      <Skeleton className="h-[200px] w-full rounded-xl" />
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length || !label) return null

  const value = payload.find(p => p.value !== undefined)
  if (!value) return null

  const formattedDate = format(parseISO(label), "d 'de' MMM", { locale: es })

  return (
    <ChartTooltipContainer active={active} payload={payload}>
      <p className="text-[11px] text-muted-foreground mb-1">{formattedDate}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[12px] text-gray-500">Saldo proyectado</span>
        <span className={cn(
          'text-[12px] font-semibold',
          value.value >= 0 ? 'text-emerald-600' : 'text-rose-600'
        )}>
          {formatCurrency(value.value, 'BOB')}
        </span>
      </div>
    </ChartTooltipContainer>
  )
}

function computeChartLayout(days: ProjectedDay[], firstNegativeDate: string | null) {
  const minBalance = Math.min(...days.map(d => d.balance))
  const maxBalance = Math.max(...days.map(d => d.balance))
  const padding = Math.max((maxBalance - minBalance) * 0.2, 100)
  return {
    yMin: Math.min(minBalance - padding, -padding),
    yMax: maxBalance + padding,
    splitIndex: (() => {
      const firstEstimated = days.find(d => d.is_estimated)
      return firstEstimated ? days.indexOf(firstEstimated) : days.length
    })(),
    hasNegativeZone: firstNegativeDate !== null,
    startNegativeIndex: firstNegativeDate !== null ? days.findIndex(d => d.date === firstNegativeDate) : -1,
  }
}

export function BalanceProjection() {
  const { days, first_negative_date, final_balance, confidence, isLoading } = useBalanceProjection()

  if (isLoading) return <ProjectionSkeleton />
  if (days.length === 0) return null

  const today = days[0]
  const { yMin, yMax, splitIndex, hasNegativeZone, startNegativeIndex } = computeChartLayout(days, first_negative_date)

  return (
    <div className="bg-card rounded-3xl p-6 border border-border/40"
      style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.02)' }}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">Proyección de Saldo</h3>
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            Basado en tu saldo actual, ingresos y gastos recurrentes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md',
            confidence === 'high' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' :
            confidence === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30' :
            'bg-gray-50 text-gray-500 dark:bg-gray-900/30'
          )}>
            {confidence === 'high' ? 'Alta confianza' : confidence === 'medium' ? 'Confianza media' : 'Estimación'}
          </span>
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(today.balance, 'BOB')}
          </span>
        </div>
      </div>

      {first_negative_date && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Saldo negativo proyectado</p>
            <p className="text-[12px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
              Se proyecta que tu saldo llegue a negativo el {format(parseISO(first_negative_date), "d 'de' MMM", { locale: es })}.
              {confidence !== 'low' && ' Revisa tus gastos recurrentes para ajustar la proyección.'}
            </p>
          </div>
        </div>
      )}

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <XAxis
              dataKey="date"
              tickFormatter={(val) => format(parseISO(val), 'd', { locale: es })}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              hide
              domain={[yMin, yMax]}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Negative zone shading */}
            {hasNegativeZone && startNegativeIndex > 0 && (
              <ReferenceArea
                x1={days[startNegativeIndex].date}
                x2={days[days.length - 1].date}
                fill="#ef4444"
                fillOpacity={0.04}
              />
            )}

            {/* Zero line */}
            <ReferenceLine y={0} stroke="#ef4444" strokeOpacity={0.3} strokeDasharray="4 4" />

            {/* Split line between actual and estimated */}
            {splitIndex > 0 && splitIndex < days.length && (
              <ReferenceLine
                x={days[splitIndex].date}
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.2}
                strokeDasharray="2 2"
                label={{
                  value: 'Estimado',
                  position: 'top',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 9,
                  opacity: 0.5,
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="balance"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#balanceGradient)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground">Real</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-40" />
            <span className="text-[10px] text-muted-foreground">Proyectado</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground/60">Proyección a fin de mes</p>
          <p className={cn(
            'text-sm font-bold tabular-nums',
            final_balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
          )}>
            {formatCurrency(final_balance, 'BOB')}
          </p>
        </div>
      </div>
    </div>
  )
}
