'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, DollarSign, Clock, Route } from 'lucide-react'
import { useDriverAnalytics } from '../hooks/useDriverAnalytics'
import { formatBs, hoursToDuration, getAppLabel, APP_BADGE_CLASS, parseLocalDate } from '../utils/driver-metrics.utils'
import type { MonthCycle } from '../hooks/useDriverShifts'

export function ShiftAnalytics({ cycle }: { cycle?: MonthCycle }) {
  const { data: analytics, isLoading, isError } = useDriverAnalytics(cycle)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-zinc-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-zinc-100 rounded-[22px] animate-pulse" />
        <div className="h-64 bg-zinc-100 rounded-[22px] animate-pulse" />
      </div>
    )
  }

  if (isError || !analytics) {
    return (
      <div className="p-8 text-center rounded-[22px] border border-zinc-200 bg-white">
        <p className="text-[13px] font-medium text-zinc-900">Error al cargar analytics</p>
      </div>
    )
  }

  if (analytics.summary.shiftCount === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-zinc-200 rounded-[22px] bg-zinc-50/50">
        <div className="size-11 rounded-xl bg-zinc-100 mx-auto mb-3 flex items-center justify-center">
          <DollarSign className="size-5 text-zinc-400" />
        </div>
        <p className="text-[13px] font-semibold text-zinc-900">Cierra tu primer turno para ver analytics</p>
        <p className="text-[11px] text-zinc-500 mt-1 max-w-[30ch] mx-auto leading-relaxed">Tus metricas apareceran aqui automaticamente.</p>
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
    totalMaintenance: summary.totalMaintenance ?? 0,
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Summary — 5 items -> 3+2 bento, sin huerfano */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <SummaryCard
          icon={<DollarSign className="size-3.5" />}
          label="Neto liquido"
          value={formatBs(s.liquidEarnings)}
          sub={`Bs ${s.liquidBsPerHour.toFixed(1)}/h`}
          tone="positive"
        />
        <SummaryCard
          icon={<TrendingUp className="size-3.5" />}
          label="Bruto / hora"
          value={`Bs ${s.grossBsPerHour.toFixed(1)}/h`}
          sub={s.totalHours > 0 ? `${formatBs(s.grossEarnings)} total` : '-'}
        />
        <SummaryCard
          icon={<DollarSign className="size-3.5" />}
          label="Promedio / turno"
          value={formatBs(s.avgPerShift)}
          sub={`${s.shiftCount} turnos`}
          tone="positive"
        />
        <SummaryCard
          icon={<Clock className="size-3.5" />}
          label="Horas"
          value={hoursToDuration(s.totalHours)}
          sub={`${s.shiftCount} turnos`}
        />
        <SummaryCard
          icon={<Route className="size-3.5" />}
          label="Kilometros"
          value={`${s.totalKm.toFixed(0)} km`}
          sub={s.totalKm > 0 ? `${(s.liquidEarnings / s.totalKm).toFixed(2)} Bs/km` : '-'}
        />
      </div>

      {/* Desglose bruto */}
      <div className="rounded-[22px] bg-white border border-zinc-200 p-5 sm:p-6">
        <h3 className="text-[13px] font-semibold text-zinc-900 tracking-tight mb-4">Desglose bruto</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <BreakdownTile label="Bruto total" value={formatBs(s.grossEarnings)} hint="Ingresos + bonos" />
          <BreakdownTile label="Pendiente" value={formatBs(s.pendingAmount)} hint="En app" />
          <BreakdownTile label="Comisiones" value={formatBs(s.totalCommissions)} hint="Descuento app" negative />
          <BreakdownTile label="Gastos" value={formatBs(s.totalExpenses)} hint="Turno" negative />
          <BreakdownTile label="Fondo mant." value={formatBs(s.totalMaintenance)} hint="6% al fondo" negative />
        </div>
      </div>

      {/* Ingresos por App */}
      <div className="rounded-[22px] bg-white border border-zinc-200 p-5 sm:p-6">
        <h3 className="text-[13px] font-semibold text-zinc-900 tracking-tight mb-4">Ingresos por app</h3>
        <div className="space-y-3">
          {analytics.byApp.map((app) => {
            const cash = app.cash ?? 0
            const card = app.card ?? 0
            const qr = app.qr ?? 0
            const bonuses = app.bonuses ?? 0
            const commissions = app.commissions ?? 0
            const totalEarned = cash + card + qr
            return (
              <div key={app.app} className="space-y-2 rounded-xl border border-zinc-200 p-3 bg-zinc-50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${APP_BADGE_CLASS}`}>
                      {getAppLabel(app.app)}
                    </span>
                    <span className="text-[11px] text-zinc-400 truncate tabular-nums">
                      {[cash > 0 && `Efec ${cash.toFixed(0)}`, card > 0 && `Tarj ${card.toFixed(0)}`, qr > 0 && `QR ${qr.toFixed(0)}`].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <span className="font-bold tabular-nums text-zinc-900 shrink-0 text-[15px]">
                    {formatBs(totalEarned)}
                  </span>
                </div>
                {(bonuses > 0 || commissions > 0) && (
                  <div className="flex gap-3 text-[11px] text-zinc-500 tabular-nums">
                    {bonuses > 0 && <span>Bonos +{formatBs(bonuses)}</span>}
                    {commissions > 0 && <span>Comis −{formatBs(commissions)}</span>}
                  </div>
                )}
                <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${Math.min((totalEarned / (Math.max(...analytics.byApp.map(a => (a.cash ?? 0) + (a.card ?? 0) + (a.qr ?? 0)), 1))) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {analytics.dailyTrend.length > 0 && (
        <div className="rounded-[22px] bg-white border border-zinc-200 p-5 sm:p-6">
          <h3 className="text-[13px] font-semibold text-zinc-900 tracking-tight mb-1">Evolucion diaria</h3>
          <p className="text-[11px] text-zinc-500 mb-4">Neto liquido por dia</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#F4F4F5" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#A1A1AA' }}
                  tickFormatter={(val) => {
                    const d = parseLocalDate(val)
                    return d.toLocaleDateString('es-BO', { weekday: 'short' }).replace('.', '').charAt(0).toUpperCase()
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#A1A1AA' }}
                />
                <Tooltip
                  cursor={{ fill: '#FAFAFA' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E4E4E7',
                    fontSize: '12px',
                    background: '#FFFFFF',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  }}
                  labelStyle={{ color: '#71717A' }}
                  itemStyle={{ color: '#18181B' }}
                  formatter={(value: number) => [formatBs(value ?? 0), 'Neto liquido']}
                  labelFormatter={(label) => parseLocalDate(label).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short' })}
                />
                <Bar dataKey="liquidEarnings" fill="#059669" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  icon, label, value, sub, tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  tone?: 'positive'
}) {
  const positive = tone === 'positive'

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className={positive ? 'text-emerald-600' : 'text-zinc-400'}>{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">{label}</span>
      </div>
      <p className="text-lg font-bold tabular-nums tracking-tight leading-none text-zinc-900">{value}</p>
      <p className="text-[11px] font-medium text-zinc-400 tabular-nums">{sub}</p>
    </div>
  )
}

function BreakdownTile({ label, value, hint, negative }: { label: string; value: string; hint: string; negative?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${negative ? 'bg-zinc-900/[0.04] border-zinc-200' : 'bg-zinc-50 border-zinc-200'}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">{label}</p>
      <p className="text-lg font-bold text-zinc-900 tabular-nums mt-1">
        {negative && value !== 'Bs 0.00' ? '−' : ''}{value}
      </p>
      <p className="text-[11px] text-zinc-400 mt-1">{hint}</p>
    </div>
  )
}
