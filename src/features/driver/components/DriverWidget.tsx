'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  CarTaxiFront,
  ChevronRight,
  CalendarRange,
  Clock,
  DollarSign,
  Route,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useShifts } from '@/features/driver/hooks/useDriverShifts'
import { formatBs, isoToLocalDateStr, parseLocalDate } from '@/features/driver/utils/driver-metrics.utils'
import type { DriverShift } from '@/types/driver'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function WidgetSkeleton() {
  return (
    <Card className="rounded-[22px] bg-white"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </CardContent>
    </Card>
  )
}

// ─── Stat ─────────────────────────────────────────────────────────────────────

function Stat({
  icon,
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  tone?: 'emerald' | 'blue' | 'neutral'
}) {
  const tones = {
    emerald: 'bg-[#F2F9E3] text-[#4F6A35] border-[#C8D9A9]',
    blue: 'bg-[#B5543D]/10 text-[#B5543D] border-[#D9A487]',
    neutral: 'bg-[#F2F9E3]/50 text-[#3C5230] border-[#E5DED2]',
  }

  return (
    <div className={`rounded-xl border p-3 space-y-1 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[9px] uppercase tracking-widest font-bold opacity-70">{label}</span>
      </div>
      <p className="text-base sm:text-lg font-bold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="text-[9px] font-medium opacity-60">{sub}</p>}
    </div>
  )
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function DriverWidget() {
  const { data: shifts = [], isLoading, isError } = useShifts()

  const stats = useMemo(() => {
    const now = new Date()
    const todayStr = localDateStr(now)

    // Inicio de semana (lunes)
    const startOfWeek = new Date(now)
    const day = startOfWeek.getDay()
    const diff = day === 0 ? -6 : 1 - day // domingo = 0, lunes = 1
    startOfWeek.setDate(startOfWeek.getDate() + diff)
    const weekStart = localDateStr(startOfWeek)

    // Inicio de mes
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    let todayLiquid = 0
    let weekLiquid = 0
    let monthLiquid = 0
    let weekHours = 0
    let weekKm = 0
    let lastShift: DriverShift | null = null

    for (const sh of shifts) {
      const dayStr = (sh.date ?? isoToLocalDateStr(sh.createdAt) ?? '').slice(0, 10)
      const liquid = sh.liquidEarnings ?? 0

      if (dayStr === todayStr) todayLiquid += liquid
      if (dayStr >= weekStart) {
        weekLiquid += liquid
        weekHours += sh.hoursWorked ?? 0
        weekKm += sh.totalKm ?? 0
      }
      if (dayStr.startsWith(monthStart)) monthLiquid += liquid
      if (dayStr && (!lastShift || dayStr > lastShift.date)) lastShift = sh
    }

    const totalLiquid = shifts.reduce((s, sh) => s + (sh.liquidEarnings ?? 0), 0)
    const avgPerShift = shifts.length > 0 ? totalLiquid / shifts.length : 0

    return { todayLiquid, weekLiquid, monthLiquid, weekHours, weekKm, avgPerShift, lastShift }
  }, [shifts])

  if (isLoading) return <WidgetSkeleton />

  if (isError || !shifts) {
    return (
      <Card className="rounded-[22px] bg-white"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
      >
        <CardContent className="py-6 text-center">
          <p className="text-sm text-[#6E6E73]">No se pudieron cargar los turnos</p>
          <Button variant="ghost" size="sm" className="mt-2" asChild>
            <Link href="/conductor">Ir a Conductor</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { todayLiquid, weekLiquid, monthLiquid, weekHours, weekKm, avgPerShift, lastShift } = stats
  const lastShiftLabel = lastShift?.date
    ? parseLocalDate(lastShift.date).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short' })
    : null

  return (
    <Card className="rounded-[22px] bg-white hover:shadow-md transition-shadow duration-300"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CarTaxiFront className="h-4 w-4 text-[#5F7D42]" />
            <span className="text-sm font-bold text-foreground tracking-[-0.01em]">Conductor</span>
            <span className="text-[10px] text-[#6E6E73] hidden sm:block">
              {shifts.length > 0 ? `${shifts.length} turno${shifts.length !== 1 ? 's' : ''} registrados` : 'Sin turnos aún'}
            </span>
          </div>
          <Link
            href="/conductor"
            className="flex items-center gap-0.5 text-[11px] font-medium text-[#6E6E73] hover:text-[#4F6A35] transition-colors"
          >
            Ver turnos
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {shifts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[rgba(0,0,0,0.12)] px-4 py-6 flex flex-col items-center gap-3 text-center">
            <CarTaxiFront className="h-8 w-8 text-[#6E6E73]/50" />
            <p className="text-xs text-[#6E6E73]">
              Registra tus turnos de conductor para ver aquí tus ingresos por día, semana y mes.
            </p>
            <Button size="sm" className="h-8 text-xs" asChild>
              <Link href="/conductor">Registrar primer turno</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat
                icon={<DollarSign className="size-3.5" />}
                label="Hoy"
                value={formatBs(todayLiquid)}
                tone="emerald"
              />
              <Stat
                icon={<CalendarRange className="size-3.5" />}
                label="Esta semana"
                value={formatBs(weekLiquid)}
                sub={weekHours > 0 ? `Bs ${(weekLiquid / weekHours).toFixed(1)}/h` : undefined}
                tone="blue"
              />
              <Stat
                icon={<TrendingUp className="size-3.5" />}
                label="Este mes"
                value={formatBs(monthLiquid)}
                tone="neutral"
              />
            </div>

            <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#F2F9E3]/50 px-3 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] text-[#6E6E73] min-w-0">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {lastShiftLabel ? (
                  <span className="truncate">Último turno: <span className="font-medium text-foreground">{lastShiftLabel}</span></span>
                ) : (
                  <span className="truncate">Sin turnos registrados</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-[#6E6E73] flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-semibold text-foreground tabular-nums">{formatBs(avgPerShift)}</span>
                  <span className="hidden sm:inline">prom/turno</span>
                </span>
                <span className="text-[11px] text-[#6E6E73] flex items-center gap-1">
                  <Route className="h-3 w-3" />
                  <span className="font-semibold text-foreground tabular-nums">{weekKm}</span>
                  <span className="hidden sm:inline">km semana</span>
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
