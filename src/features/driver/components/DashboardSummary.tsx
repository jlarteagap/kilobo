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
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MiniCard
          icon={<DollarSign className="size-3.5 shrink-0" />}
          label="Hoy"
          value={formatBs(today.liquid)}
          sub={today.maintenance > 0 ? `${formatBs(today.maintenance)} mant.` : undefined}
          color="emerald"
        />
        <MiniCard
          icon={<CalendarRange className="size-3.5 shrink-0" />}
          label="Esta semana"
          value={formatBs(week.liquid)}
          sub={week.hours > 0 ? `Bs ${(week.liquid / week.hours).toFixed(1)}/h` : undefined}
          color="accent"
        />
        <MiniCard
          icon={<TrendingUp className="size-3.5 shrink-0" />}
          label="Este mes"
          value={formatBs(month.liquid)}
          sub={month.maintenance > 0 ? `${formatBs(month.maintenance)} fondo` : undefined}
          color="neutral"
        />
      </div>

      <MaintenanceFundCard />
    </div>
  )
}

function MiniCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: 'emerald' | 'accent' | 'neutral'
}) {
  const colors = {
    emerald: 'bg-card dark:bg-card border-border text-primary dark:text-primary border',
    accent: 'bg-secondary dark:bg-secondary border-border text-secondary-foreground dark:text-secondary-foreground border',
    neutral: 'bg-card-soft dark:bg-muted border-border text-tint-sage dark:text-muted-foreground border',
  }

  return (
    <div className={`rounded-xl border p-3 sm:p-4 space-y-1.5 ${colors[color]}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-semibold tracking-tight opacity-70">{label}</span>
      </div>
      <p className="text-base sm:text-lg font-bold tabular-nums tracking-tight leading-none">{value}</p>
      {sub && <p className="text-[11px] font-medium opacity-60 tabular-nums">{sub}</p>}
    </div>
  )
}