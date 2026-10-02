'use client'

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
import { useShiftPeriodStats } from '@/features/driver/hooks/useShiftPeriodStats'
import { formatBs, parseLocalDate } from '@/features/driver/utils/driver-metrics.utils'
import { MaintenanceFundCard } from './MaintenanceFundCard'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function WidgetSkeleton() {
  return (
    <Card className="rounded-[22px] bg-white border border-zinc-200">
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-32 bg-zinc-100" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-20 w-full rounded-xl bg-zinc-100" />
          <Skeleton className="h-20 w-full rounded-xl bg-zinc-100" />
          <Skeleton className="h-20 w-full rounded-xl bg-zinc-100" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl bg-zinc-100" />
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
  tone?: 'positive' | 'neutral'
}) {
  const positive = tone === 'positive'

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className={positive ? 'text-emerald-600' : 'text-zinc-400'}>{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">{label}</span>
      </div>
      <p className="text-[17px] font-bold tabular-nums tracking-tight leading-none text-zinc-900">
        {value}
      </p>
      {sub && <p className="text-[11px] font-medium text-zinc-400 tabular-nums">{sub}</p>}
    </div>
  )
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function DriverWidget() {
  const { data: shifts = [], isLoading, isError } = useShifts()
  const { today, week, month, lastShift, avgPerShift } = useShiftPeriodStats(shifts)

  if (isLoading) return <WidgetSkeleton />

  if (isError || !shifts) {
    return (
      <Card className="rounded-[22px] bg-white border border-zinc-200">
        <CardContent className="py-6 text-center">
          <p className="text-[13px] text-zinc-500">No se pudieron cargar los turnos</p>
          <Button variant="ghost" size="sm" className="mt-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100" asChild>
            <Link href="/conductor">Ir a Conductor</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const lastShiftLabel = lastShift?.date
    ? parseLocalDate(lastShift.date).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short' })
    : null

  return (
    <Card className="rounded-[22px] bg-white border border-zinc-200 hover:border-zinc-300 transition-colors duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CarTaxiFront className="h-4 w-4 text-zinc-400 shrink-0" />
            <span className="text-sm font-semibold text-zinc-900 tracking-tight">Conductor</span>
            <span className="text-[11px] text-zinc-400 hidden sm:block truncate">
              {shifts.length > 0 ? `${shifts.length} turno${shifts.length !== 1 ? 's' : ''}` : 'Sin turnos aun'}
            </span>
          </div>
          <Link
            href="/conductor"
            className="flex items-center gap-0.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors shrink-0"
          >
            Ver turnos
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {shifts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-6 flex flex-col items-center gap-3 text-center">
            <CarTaxiFront className="h-7 w-7 text-zinc-300" />
            <p className="text-[11px] text-zinc-500 max-w-[30ch] leading-relaxed">
              Registra tus turnos para ver ingresos por dia, semana y mes.
            </p>
            <Button
              size="sm"
              className="h-8 text-[11px] rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white"
              asChild
            >
              <Link href="/conductor">Registrar primer turno</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Stat
                icon={<DollarSign className="size-3.5" />}
                label="Hoy"
                value={formatBs(today.liquid)}
                sub={today.maintenance > 0 ? `${formatBs(today.maintenance)} mant.` : undefined}
                tone="positive"
              />
              <Stat
                icon={<CalendarRange className="size-3.5" />}
                label="Esta semana"
                value={formatBs(week.liquid)}
                sub={week.hours > 0 ? `Bs ${(week.liquid / week.hours).toFixed(1)}/h` : undefined}
              />
              <Stat
                icon={<TrendingUp className="size-3.5" />}
                label="Este mes"
                value={formatBs(month.liquid)}
                sub={month.maintenance > 0 ? `${formatBs(month.maintenance)} fondo` : undefined}
              />
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 min-w-0">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {lastShiftLabel ? (
                  <span className="truncate">Ultimo turno: <span className="font-medium text-zinc-900">{lastShiftLabel}</span></span>
                ) : (
                  <span className="truncate">Sin turnos registrados</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-semibold text-zinc-900 tabular-nums">{formatBs(avgPerShift)}</span>
                  <span className="hidden sm:inline">prom/turno</span>
                </span>
                <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Route className="h-3 w-3" />
                  <span className="font-semibold text-zinc-900 tabular-nums">{week.km}</span>
                  <span className="hidden sm:inline">km semana</span>
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100">
              <MaintenanceFundCard />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
