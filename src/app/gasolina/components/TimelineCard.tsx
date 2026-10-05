'use client'

import { Fuel, Wrench } from 'lucide-react'
import type { CarCycle } from '@/types/car-sharing'
import type { CarMaintenanceLog } from '@/types/car-maintenance'
import { buildTimeline, type TimelineEntry } from '@/app/gasolina/utils/timeline.utils'
import { formatCycleDate } from '@/app/gasolina/utils/format'
import { cn } from '@/lib/utils'

interface TimelineCardProps {
  cycles: CarCycle[]
  logs: CarMaintenanceLog[]
}

/**
 * Gasolina y mantenimiento en la misma columna.
 *
 * Cada servicio muestra el promedio de L/100km de los tres ciclos que le
 * siguieron. Si el consumo bajo despues del aditivo, se ve; si subio, tambien.
 */
export function TimelineCard({ cycles, logs }: TimelineCardProps) {
  const entries = buildTimeline(cycles, logs, { maintenanceBefore: 3 })

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="rounded-[22px] border border-zinc-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 p-5 border-b border-zinc-100">
        <div className="size-11 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
          <div className="size-2.5 rounded-full bg-zinc-300" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-zinc-900 tracking-tight">
            Historial del auto
          </h2>
          <p className="text-xs text-zinc-500">Cargas y servicios en orden</p>
        </div>
      </div>

      <div>
        {entries.map(entry => (
          <TimelineRow key={`${entry.kind}-${entry.id}`} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function TimelineRow({ entry }: { entry: TimelineEntry }) {
  const isCycle = entry.kind === 'cycle'

  return (
    <div className="flex items-start gap-3 px-5 py-3 border-b border-zinc-100 last:border-0">
      <div
        className={cn(
          'size-7 shrink-0 rounded-lg flex items-center justify-center mt-0.5',
          isCycle ? 'bg-zinc-100' : 'bg-emerald-50',
        )}
      >
        {isCycle ? (
          <Fuel className="size-3.5 text-zinc-400" />
        ) : (
          <Wrench className="size-3.5 text-emerald-600" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-medium text-zinc-900 truncate">
            {entry.title}
          </span>
          <span className="text-[11px] text-zinc-400 tabular-nums shrink-0">
            {formatCycleDate(entry.at)}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">{entry.detail}</p>
      </div>
    </div>
  )
}