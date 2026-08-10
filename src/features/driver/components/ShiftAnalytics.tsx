'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, DollarSign, Clock, Route, PieChart, Ban } from 'lucide-react'
import { useDriverAnalytics } from '../hooks/useDriverAnalytics'
import { formatBs, hoursToDuration, getAppLabel, getAppBadgeColor, parseLocalDate } from '../utils/driver-metrics.utils'
import { DRIVER_APPS } from '@/types/driver'

export function ShiftAnalytics() {
  const { data: analytics, isLoading, isError } = useDriverAnalytics()

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-[#F2F9E3]/40 rounded-2xl" />
        <div className="h-48 bg-[#F2F9E3]/40 rounded-2xl" />
        <div className="h-64 bg-[#F2F9E3]/40 rounded-2xl" />
      </div>
    )
  }

  if (isError || !analytics) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[#B5543D] font-medium">Error al cargar analytics</p>
      </div>
    )
  }

  if (analytics.summary.shiftCount === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-[rgba(0,0,0,0.12)] rounded-2xl">
        <DollarSign className="size-8 text-[#6E6E73]/60 mx-auto mb-3" />
        <p className="text-sm text-[#6E6E73] font-medium">Cierra tu primer turno para ver analytics</p>
      </div>
    )
  }

  const { summary } = analytics

  // Null-safe: nunca confiar en que los campos vengan como número
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={<DollarSign className="size-4" />}
          label="Neto líquido"
          value={formatBs(s.liquidEarnings)}
          sub={`Bs ${s.liquidBsPerHour.toFixed(1)}/h líquido`}
          color="emerald"
        />
        <SummaryCard
          icon={<TrendingUp className="size-4" />}
          label="Bruto / hora"
          value={`Bs ${s.grossBsPerHour.toFixed(1)}/h`}
          sub={s.totalHours > 0 ? `${formatBs(s.grossEarnings)} total` : '—'}
          color="blue"
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
          color="blue"
        />
        <SummaryCard
          icon={<Route className="size-4" />}
          label="Kilómetros"
          value={`${s.totalKm.toFixed(0)} km`}
          sub={s.totalKm > 0 ? `${(s.liquidEarnings / s.totalKm).toFixed(2)} Bs/km` : '—'}
          color="orange"
        />
      </div>

      {/* ── Breakdown bruto ── */}
      <div className="rounded-[22px] bg-white p-6"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
      >
        <h3 className="text-xs font-bold text-[#6E6E73] uppercase tracking-widest mb-5">Desglose bruto</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-xl bg-[#F2F9E3]/40">
            <p className="text-[9px] uppercase tracking-widest text-[#6E6E73] font-bold">Bruto total</p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-1">{formatBs(s.grossEarnings)}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50">
            <p className="text-[9px] uppercase tracking-widest text-amber-600/70 font-bold">Pendiente</p>
            <p className="text-lg font-bold text-amber-600 tabular-nums mt-1">{formatBs(s.pendingAmount)}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FAEDE9]">
            <p className="text-[9px] uppercase tracking-widest text-[#B5543D]/70 font-bold">Comisiones</p>
            <p className="text-lg font-bold text-[#B5543D] tabular-nums mt-1">{formatBs(s.totalCommissions)}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FAEDE9]">
            <p className="text-[9px] uppercase tracking-widest text-[#B5543D]/70 font-bold">Gastos</p>
            <p className="text-lg font-bold text-[#B5543D] tabular-nums mt-1">{formatBs(s.totalExpenses)}</p>
          </div>
        </div>
      </div>

      {/* ── Rendimiento por App ── */}
      <div className="rounded-[22px] bg-white p-6"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
      >
        <h3 className="text-xs font-bold text-[#6E6E73] uppercase tracking-widest mb-5">Ingresos por App</h3>
        <div className="space-y-4">
          {analytics.byApp.map((app) => {
            const cash = app.cash ?? 0
            const card = app.card ?? 0
            const qr = app.qr ?? 0
            const bonuses = app.bonuses ?? 0
            const commissions = app.commissions ?? 0
            const totalEarned = cash + card + qr
            return (
              <div key={app.app} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getAppBadgeColor(app.app)}`}>
                      {getAppLabel(app.app)}
                    </span>
                    <span className="text-[11px] text-[#6E6E73]">
                      {cash > 0 && `Efec: ${cash.toFixed(0)}`}
                      {card > 0 && ` | Tarj: ${card.toFixed(0)}`}
                      {qr > 0 && ` | QR: ${qr.toFixed(0)}`}
                    </span>
                  </div>
                  <span className="font-bold tabular-nums text-foreground">
                    {formatBs(totalEarned)}
                  </span>
                </div>
                <div className="flex gap-1 text-[10px] text-[#6E6E73]">
                  {bonuses > 0 && <span>Bonos: {formatBs(bonuses)}</span>}
                  {commissions > 0 && <span className="text-[#B5543D] ml-2">Comis: {formatBs(commissions)}</span>}
                </div>
                {/* Barra comparativa */}
                <div className="h-1.5 rounded-full bg-[rgba(0,0,0,0.06)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#4F6A35] transition-all duration-500"
                    style={{ width: `${Math.min((totalEarned / (Math.max(...analytics.byApp.map(a => (a.cash ?? 0) + (a.card ?? 0) + (a.qr ?? 0)), 1))) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Daily Trend ── */}
      {analytics.dailyTrend.length > 0 && (
        <div className="rounded-[22px] bg-white p-6"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
        >
          <h3 className="text-xs font-bold text-[#6E6E73] uppercase tracking-widest mb-5">Evolución — Neto líquido diario</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="text-[rgba(0,0,0,0.08)]" stroke="currentColor" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#a3a3a3' }}
                  tickFormatter={(val) => {
                    const d = parseLocalDate(val)
                    return d.toLocaleDateString('es-BO', { weekday: 'short' }).replace('.', '').charAt(0).toUpperCase()
                  }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', fontSize: '12px' }}
                  formatter={(value: number) => [formatBs(value ?? 0), 'Neto líquido']}
                  labelFormatter={(label) => parseLocalDate(label).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short' })}
                />
                <Bar dataKey="liquidEarnings" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-[#4F6A35]" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────
function SummaryCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: 'emerald' | 'amber' | 'blue' | 'orange'
}) {
  const colorMap = {
    emerald: 'bg-[#F2F9E3] text-[#4F6A35] border-[#C8D9A9]',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  }

  return (
    <div className={`rounded-xl border p-4 space-y-2 ${colorMap[color]}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">{label}</span>
      </div>
      <p className="text-xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="text-[10px] font-medium opacity-60">{sub}</p>
    </div>
  )
}
