'use client'

import { useMemo } from 'react'
import { TrendingUp, DollarSign, CalendarRange } from 'lucide-react'
import type { DriverShift } from '@/types/driver'
import { formatBs, isoToLocalDateStr } from '../utils/driver-metrics.utils'

interface DashboardSummaryProps {
  shifts: DriverShift[]
}

export function DashboardSummary({ shifts }: DashboardSummaryProps) {
  const { today, week, month } = useMemo(() => {
    const now = new Date()
    const todayStr = localDateStr(now)

    // Inicio de semana (lunes)
    const startOfWeek = new Date(now)
    const day = startOfWeek.getDay()
    const diff = day === 0 ? -6 : 1 - day
    startOfWeek.setDate(startOfWeek.getDate() + diff)
    const weekStart = localDateStr(startOfWeek)

    // Inicio de mes
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    let todayLiquid = 0
    let todayMaintenance = 0
    let weekLiquid = 0
    let monthLiquid = 0
    let weekHours = 0

    for (const sh of shifts) {
      const dayStr = (sh.date ?? isoToLocalDateStr(sh.createdAt) ?? '').slice(0, 10)
      const liquid = sh.liquidEarnings ?? 0

      if (dayStr === todayStr) {
        todayLiquid += liquid
        todayMaintenance += sh.maintenanceReserve ?? 0
      }
      if (dayStr >= weekStart) {
        weekLiquid += liquid
        weekHours += sh.hoursWorked ?? 0
      }
      if (dayStr.startsWith(monthStart)) monthLiquid += liquid
    }

    return {
      today: { liquid: todayLiquid, maintenance: todayMaintenance },
      week: { liquid: weekLiquid, hours: weekHours },
      month: { liquid: monthLiquid },
    }
  }, [shifts])

  return (
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
        color="neutral"
      />
    </div>
  )
}

function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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
