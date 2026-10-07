'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ShiftStat {
  icon: ReactNode
  label: string
  value: string
  sub?: string
  tone?: 'positive'
}

/**
 * Las tres cifras de ingresos por periodo (hoy / semana / mes).
 *
 * Se renderiza en dos contextos con anchos muy distintos: el rail de 1/3 del
 * dashboard (~341px utiles) y la pagina /conductor a ancho completo. Por eso
 * decide con container queries y NO con breakpoints de viewport: `sm:` mide la
 * ventana, y en un laptop de 1280px el rail esta en su punto mas angosto
 * mientras `sm:` ya esta activo, lo que deja las tres cifras en ~77px de texto
 * y hace que los montos se solapen.
 *
 * Estrecho -> filas separadas por hairline (sin cajas, mas compacto y sin
 * possibility de solape). Ancho -> 3 tiles, que es lo que aprovecha el espacio.
 */
export function ShiftStatList({ stats, className }: { stats: ShiftStat[]; className?: string }) {
  return (
    <div className={cn('@container', className)}>
      <div className="divide-y divide-zinc-100 @2xl:hidden">
        {stats.map((stat) => (
          <ShiftStatRow key={stat.label} {...stat} />
        ))}
      </div>
      <div className="hidden @2xl:grid @2xl:grid-cols-3 @2xl:gap-3">
        {stats.map((stat) => (
          <ShiftStatTile key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  )
}

function ShiftStatRow({ icon, label, value, sub, tone }: ShiftStat) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn('shrink-0', tone === 'positive' ? 'text-emerald-600' : 'text-zinc-400')}>
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-medium text-zinc-500 truncate">{label}</span>
          {sub && <span className="block text-[11px] text-zinc-400 tabular-nums truncate">{sub}</span>}
        </span>
      </div>
      {/* shrink-0 + truncate en el label: el monto nunca se pisa, por largo que sea. */}
      <span className="shrink-0 text-sm font-semibold tabular-nums tracking-tight text-zinc-900">
        {value}
      </span>
    </div>
  )
}

function ShiftStatTile({ icon, label, value, sub, tone }: ShiftStat) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className={cn('shrink-0', tone === 'positive' ? 'text-emerald-600' : 'text-zinc-400')}>
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 truncate">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold tabular-nums tracking-tight leading-none text-zinc-900 truncate">
        {value}
      </p>
      {sub && <p className="text-[11px] text-zinc-400 tabular-nums truncate">{sub}</p>}
    </div>
  )
}