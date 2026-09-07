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
    <Card className="rounded-[22px] bg-card dark:bg-card border border-border shadow-sm"
    >
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
  tone?: 'emerald' | 'accent' | 'neutral'
}) {
  const tones = {
    emerald: 'bg-secondary dark:bg-secondary border-border text-primary',
    accent: 'bg-card dark:bg-card border-border text-foreground',
    neutral: 'bg-card-soft dark:bg-muted border-border text-tint-sage dark:text-muted-foreground',
  }

  return (
    <div className={`rounded-xl border p-3 space-y-1.5 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-semibold tracking-tight opacity-70">{label}</span>
      </div>
      <p className="text-base sm:text-lg font-bold tabular-nums tracking-tight leading-none">{value}</p>
      {sub && <p className="text-xs font-medium opacity-60 tabular-nums">{sub}</p>}
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
      <Card className="rounded-[22px] bg-card dark:bg-card border border-border shadow-sm"
      >
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">No se pudieron cargar los turnos</p>
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
    <Card className="rounded-[22px] bg-card dark:bg-card border border-border hover:shadow-md transition-shadow duration-300 shadow-sm"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CarTaxiFront className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-bold text-foreground tracking-tight">Conductor</span>
            <span className="text-xs text-muted-foreground hidden sm:block truncate">
              {shifts.length > 0 ? `${shifts.length} turno${shifts.length !== 1 ? 's' : ''}` : 'Sin turnos aun'}
            </span>
          </div>
          <Link
            href="/conductor"
            className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            Ver turnos
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {shifts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card dark:bg-card px-4 py-6 flex flex-col items-center gap-3 text-center">
            <CarTaxiFront className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground max-w-[28ch]">
              Registra tus turnos para ver ingresos por dia, semana y mes.
            </p>
            <Button size="sm" className="h-8 text-xs rounded-xl" asChild>
              <Link href="/conductor">Registrar primer turno</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                tone="accent"
              />
              <Stat
                icon={<TrendingUp className="size-3.5" />}
                label="Este mes"
                value={formatBs(monthLiquid)}
                tone="neutral"
              />
            </div>

            <div className="rounded-xl border border-border bg-secondary/60 dark:bg-muted/40 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {lastShiftLabel ? (
                  <span className="truncate">Ultimo turno: <span className="font-medium text-foreground">{lastShiftLabel}</span></span>
                ) : (
                  <span className="truncate">Sin turnos registrados</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-semibold text-foreground tabular-nums">{formatBs(avgPerShift)}</span>
                  <span className="hidden sm:inline">prom/turno</span>
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
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
