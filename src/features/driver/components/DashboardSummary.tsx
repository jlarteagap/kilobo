'use client'

import { TrendingUp, DollarSign, CalendarRange } from 'lucide-react'
import type { DriverShift } from '@/types/driver'
import { formatBs } from '../utils/driver-metrics.utils'
import { useShiftPeriodStats } from '../hooks/useShiftPeriodStats'
import { ShiftStatList } from './ShiftStatList'
import { MaintenanceFundCard } from './MaintenanceFundCard'

interface DashboardSummaryProps {
  shifts: DriverShift[]
}

export function DashboardSummary({ shifts }: DashboardSummaryProps) {
  const { today, week, month } = useShiftPeriodStats(shifts)

  return (
    <div className="space-y-3">
      <ShiftStatList
        stats={[
          {
            icon: <DollarSign className="size-3.5 shrink-0" />,
            label: 'Hoy',
            value: formatBs(today.liquid),
            sub: today.maintenance > 0 ? `${formatBs(today.maintenance)} mant.` : undefined,
            tone: 'positive',
          },
          {
            icon: <CalendarRange className="size-3.5 shrink-0" />,
            label: 'Esta semana',
            value: formatBs(week.liquid),
            sub: week.hours > 0 ? `Bs ${(week.liquid / week.hours).toFixed(1)}/h` : undefined,
          },
          {
            icon: <TrendingUp className="size-3.5 shrink-0" />,
            label: 'Este mes',
            value: formatBs(month.liquid),
            sub: month.maintenance > 0 ? `${formatBs(month.maintenance)} fondo` : undefined,
          },
        ]}
      />

      <MaintenanceFundCard />
    </div>
  )
}