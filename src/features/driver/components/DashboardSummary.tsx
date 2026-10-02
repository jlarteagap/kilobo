'use client'

import { TrendingUp, DollarSign, CalendarRange } from 'lucide-react'
import type { DriverShift } from '@/types/driver'
import { formatBs } from '../utils/driver-metrics.utils'
import { useShiftPeriodStats } from '../hooks/useShiftPeriodStats'
import { MaintenanceFundCard } from './MaintenanceFundCard'

interface DashboardSummaryProps {
  shifts: DriverShift[]
}

export function DashboardSummary({ shifts }: DashboardSummaryProps) {
  const { today, week, month } = useShiftPeriodStats(shifts)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MiniCard
          icon={<DollarSign className="size-3.5 shrink-0" />}
          label="Hoy"
          value={formatBs(today.liquid)}
          sub={today.maintenance > 0 ? `${formatBs(today.maintenance)} mant.` : undefined}
          tone="positive"
        />
        <MiniCard
          icon={<CalendarRange className="size-3.5 shrink-0" />}
          label="Esta semana"
          value={formatBs(week.liquid)}
          sub={week.hours > 0 ? `Bs ${(week.liquid / week.hours).toFixed(1)}/h` : undefined}
        />
        <MiniCard
          icon={<TrendingUp className="size-3.5 shrink-0" />}
          label="Este mes"
          value={formatBs(month.liquid)}
          sub={month.maintenance > 0 ? `${formatBs(month.maintenance)} fondo` : undefined}
        />
      </div>

      <MaintenanceFundCard />
    </div>
  )
}

function MiniCard({
  icon, label, value, sub, tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  tone?: 'positive'
}) {
  const positive = tone === 'positive'

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 sm:p-4 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className={positive ? 'text-emerald-600' : 'text-zinc-400'}>{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">{label}</span>
      </div>
      <p className="text-[17px] sm:text-lg font-bold tabular-nums tracking-tight leading-none text-zinc-900">
        {value}
      </p>
      {sub && <p className="text-[11px] font-medium text-zinc-400 tabular-nums">{sub}</p>}
    </div>
  )
}