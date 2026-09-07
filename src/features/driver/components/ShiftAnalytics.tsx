'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, DollarSign, Clock, Route } from 'lucide-react'
import { useDriverAnalytics } from '../hooks/useDriverAnalytics'
import { formatBs, hoursToDuration, getAppLabel, getAppBadgeColor, parseLocalDate } from '../utils/driver-metrics.utils'
import type { MonthCycle } from '../hooks/useDriverShifts'

export function ShiftAnalytics({ cycle }: { cycle?: MonthCycle }) {
  const { data: analytics, isLoading, isError } = useDriverAnalytics(cycle)

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-secondary dark:bg-muted rounded-[22px]" />
        <div className="h-48 bg-secondary dark:bg-muted rounded-[22px]" />
        <div className="h-64 bg-secondary dark:bg-muted rounded-[22px]" />
      </div>
    )
  }

  if (isError || !analytics) {
    return (
      <div className="p-8 text-center rounded-xl border border-border bg-card dark:bg-card">
        <p className="text-sm text-destructive font-medium">Error al cargar analytics</p>
      </div>
    )
  }

  if (analytics.summary.shiftCount === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-border rounded-[22px] bg-card dark:bg-card">
        <DollarSign className="size-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-semibold text-foreground">Cierra tu primer turno para ver analytics</p>
        <p className="text-xs text-muted-foreground mt-1">Tus metricas apareceran aqui automaticamente.</p>
      </div>
    )
  }

  const { summary } = analytics

  const s = {
    liquidEarnings: summary.liquidEarnings ?? 0,
    liquidBsPerHour: summary.liquidBsPerHour ?? 0,
    grossEarnings: summary.grossEarnings ?? 0,
    grossBsPerHour: summary.grossBsPerHour ?? 0,
    avgPerShift: summary.avgPerShift ?? 0,
    totalHours: summary.totalHours ?? 0,
    totalKm: summary.totalKm ?? 0,
    shiftCount: summary.shiftCount ?? 0,
    pendingAmount: summary.pendingAmount ?? 0,
    totalCommissions: summary.totalCommissions ?? 0,
    totalExpenses: summary.totalExpenses ?? 0,
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary — 5 items -> 3+2 bento, sin huerfano */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <SummaryCard
          icon={<DollarSign className="size-4" />}
          label="Neto liquido"
          value={formatBs(s.liquidEarnings)}
          sub={`Bs ${s.liquidBsPerHour.toFixed(1)}/h`}
          color="emerald"
        />
        <SummaryCard
          icon={<TrendingUp className="size-4" />}
          label="Bruto / hora"
          value={`Bs ${s.grossBsPerHour.toFixed(1)}/h`}
          sub={s.totalHours > 0 ? `${formatBs(s.grossEarnings)} total` : '-'}
          color="neutral"
        />
        <SummaryCard
          icon={<DollarSign className="size-4" />}
          label="Promedio / turno"
          value={formatBs(s.avgPerShift)}
          sub={`${s.shiftCount} turnos`}
          color="emerald"
        />
        <SummaryCard
          icon={<Clock className="size-4" />}
          label="Horas"
          value={hoursToDuration(s.totalHours)}
          sub={`${s.shiftCount} turnos`}
          color="neutral"
        />
        <SummaryCard
          icon={<Route className="size-4" />}
          label="Kilometros"
          value={`${s.totalKm.toFixed(0)} km`}
          sub={s.totalKm > 0 ? `${(s.liquidEarnings / s.totalKm).toFixed(2)} Bs/km` : '-'}
          color="neutral"
        />
      </div>

      {/* Desglose bruto — 2x2 con variacion tint vs flat */}
      <div className="rounded-[22px] bg-card dark:bg-card border border-border p-6 shadow-sm"
      >
        <h3 className="text-xs font-semibold text-foreground mb-4">Desglose bruto</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-4 rounded-xl bg-secondary dark:bg-muted border border-border">
            <p className="text-xs font-medium text-muted-foreground">Bruto total</p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-1">{formatBs(s.grossEarnings)}</p>
            <p className="text-xs text-muted-foreground mt-1">Ingresos + bonos</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Pendiente</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400 tabular-nums mt-1">{formatBs(s.pendingAmount)}</p>
            <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1">En app</p>
          </div>
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <p className="text-xs font-medium text-destructive">Comisiones</p>
            <p className="text-lg font-bold text-destructive tabular-nums mt-1">{formatBs(s.totalCommissions)}</p>
            <p className="text-xs text-destructive/70 mt-1">Descuento app</p>
          </div>
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <p className="text-xs font-medium text-destructive">Gastos</p>
            <p className="text-lg font-bold text-destructive tabular-nums mt-1">{formatBs(s.totalExpenses)}</p>
            <p className="text-xs text-destructive/70 mt-1">Turno</p>
          </div>
        </div>
      </div>

      {/* Ingresos por App */}
      <div className="rounded-[22px] bg-card dark:bg-card border border-border p-6 shadow-sm"
      >
        <h3 className="text-xs font-semibold text-foreground mb-4">Ingresos por app</h3>
        <div className="space-y-4">
          {analytics.byApp.map((app) => {
            const cash = app.cash ?? 0
            const card = app.card ?? 0
            const qr = app.qr ?? 0
            const bonuses = app.bonuses ?? 0
            const commissions = app.commissions ?? 0
            const totalEarned = cash + card + qr
            return (
              <div key={app.app} className="space-y-2 rounded-xl border border-border p-3 bg-card dark:bg-card">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${getAppBadgeColor(app.app)}`}>
                      {getAppLabel(app.app)}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {[cash > 0 && `Efec ${cash.toFixed(0)}`, card > 0 && `Tarj ${card.toFixed(0)}`, qr > 0 && `QR ${qr.toFixed(0)}`].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <span className="font-bold tabular-nums text-foreground shrink-0 text-sm">
                    {formatBs(totalEarned)}
                  </span>
                </div>
                {(bonuses > 0 || commissions > 0) && (
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {bonuses > 0 && <span>Bonos {formatBs(bonuses)}</span>}
                    {commissions > 0 && <span className="text-destructive">Comis {formatBs(commissions)}</span>}
                  </div>
                )}
                <div className="h-1.5 rounded-full bg-muted dark:bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min((totalEarned / (Math.max(...analytics.byApp.map(a => (a.cash ?? 0) + (a.card ?? 0) + (a.qr ?? 0)), 1))) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {analytics.dailyTrend.length > 0 && (
        <div className="rounded-[22px] bg-card dark:bg-card border border-border p-6 shadow-sm"
        >
          <h3 className="text-xs font-semibold text-foreground mb-4">Evolucion diaria — neto liquido</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" stroke="currentColor" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => {
                    const d = parseLocalDate(val)
                    return d.toLocaleDateString('es-BO', { weekday: 'short' }).replace('.', '').charAt(0).toUpperCase()
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
                  formatter={(value: number) => [formatBs(value ?? 0), 'Neto liquido']}
                  labelFormatter={(label) => parseLocalDate(label).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short' })}
                />
                <Bar dataKey="liquidEarnings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: 'emerald' | 'neutral'
}) {
  const colorMap = {
    emerald: 'bg-secondary dark:bg-secondary border-border text-primary',
    neutral: 'bg-card dark:bg-card border-border text-foreground',
  }

  return (
    <div className={`rounded-xl border p-4 space-y-2 ${colorMap[color]}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold opacity-70">{label}</span>
      </div>
      <p className="text-lg font-bold tabular-nums tracking-tight leading-none">{value}</p>
      <p className="text-xs font-medium opacity-60 tabular-nums">{sub}</p>
    </div>
  )
}
