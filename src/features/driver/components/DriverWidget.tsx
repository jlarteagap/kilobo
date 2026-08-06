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
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
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
    emerald: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50',
    blue: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/50',
    neutral: 'bg-neutral-50 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 border-neutral-100 dark:border-neutral-800',
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
      <Card className="border border-border/50 bg-card/50">
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
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CarTaxiFront className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold tracking-tight">Conductor</span>
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              {shifts.length > 0 ? `${shifts.length} turno${shifts.length !== 1 ? 's' : ''} registrados` : 'Sin turnos aún'}
            </span>
          </div>
          <Link
            href="/conductor"
            className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver turnos
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {shifts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 flex flex-col items-center gap-3 text-center">
            <CarTaxiFront className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
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

            <div className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground min-w-0">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {lastShiftLabel ? (
                  <span className="truncate">Último turno: <span className="font-medium text-foreground">{lastShiftLabel}</span></span>
                ) : (
                  <span className="truncate">Sin turnos registrados</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-semibold text-foreground tabular-nums">{formatBs(avgPerShift)}</span>
                  <span className="hidden sm:inline">prom/turno</span>
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
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
