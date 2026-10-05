'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Fuel, Info } from 'lucide-react'
import type { CarCycle } from '@/types/car-sharing'
import {
  ALERT_THRESHOLD_PCT,
  ConsumptionSeries,
  averageLitersPer100,
  buildConsumptionSeries,
} from '@/app/gasolina/utils/consumption.utils'
import { formatMonthShort } from '@/app/gasolina/utils/format'
import { cn } from '@/lib/utils'

interface ConsumptionCardProps {
  cycles: CarCycle[]
  className?: string
}

function Metric({
  value,
  unit,
  label,
}: {
  value: string
  unit: string
  label: string
}) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-semibold text-zinc-900 tabular-nums truncate">
        {value}
        <span className="ml-1 text-[11px] font-medium text-zinc-400">{unit}</span>
      </p>
      <p className="text-[11px] text-zinc-500 mt-0.5">{label}</p>
    </div>
  )
}

function ConsumptionBars({ series }: { series: ConsumptionSeries }) {
  const max = Math.max(...series.points.map(p => p.litersPer100))
  const scale = max > 0 ? max : 1

  return (
    <div className="space-y-1.5">
      {series.points.map(point => {
        const pct = (point.litersPer100 / scale) * 100
        const above = point.litersPer100 > (series.baseline ?? 0) + ALERT_THRESHOLD_PCT / 100 * (series.baseline ?? 0)

        return (
          <div key={point.cycleId} className="flex items-center gap-3">
            <span className="w-9 shrink-0 text-[11px] text-zinc-400 capitalize">
              {formatMonthShort(point.endDate)}
            </span>
            <div className="relative h-5 flex-1 rounded-[3px] bg-zinc-50 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-r-[3px]',
                  above ? 'bg-zinc-900' : point.isBest ? 'bg-zinc-300' : 'bg-zinc-400',
                )}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span
              className={cn(
                'w-14 shrink-0 text-right text-[11px] tabular-nums',
                point.isBest ? 'text-zinc-400' : 'text-zinc-600 font-medium',
              )}
            >
              {point.litersPer100.toFixed(1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function ConsumptionCard({ cycles, className }: ConsumptionCardProps) {
  const [showAll, setShowAll] = useState(false)
  const series = useMemo(() => buildConsumptionSeries(cycles), [cycles])
  const average = useMemo(() => averageLitersPer100(series), [series])

  if (series.comparableCount === 0) {
    return (
      <div
        className={cn(
          'rounded-[22px] border border-zinc-200 bg-white p-6',
          className,
        )}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="size-11 rounded-xl bg-zinc-100 flex items-center justify-center">
            <Fuel className="size-4 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-zinc-900 tracking-tight">
              Consumo
            </h2>
            <p className="text-xs text-zinc-500 capitalize">Gasolina por kilómetro</p>
          </div>
        </div>

        <div className="rounded-xl bg-zinc-50/50 border border-zinc-100 px-5 py-8 text-center">
          <div className="size-11 rounded-xl bg-zinc-100 mx-auto mb-3 flex items-center justify-center">
            <div className="size-2.5 rounded-full bg-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-900">
            Sin litros registrados
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Al cerrar un ciclo, anota cuántos litros cargaste. Con dos o más
            ciclos con litros podemos decirte si el auto está gastando más de lo
            normal.
          </p>
        </div>
      </div>
    )
  }

  const latest = series.latest
  const delta = series.deltaPct ?? 0
  const visible = showAll ? series.points : series.points.slice(-6)
  const hiddenCount = series.points.length - visible.length

  return (
    <div className={cn('rounded-[22px] border border-zinc-200 bg-white p-6', className)}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-11 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
            <Fuel className="size-4 text-zinc-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-zinc-900 tracking-tight">
              Consumo
            </h2>
            <p className="text-xs text-zinc-500 capitalize">
              Último ciclo · {formatMonthShort(latest!.endDate)}
            </p>
          </div>
        </div>
        {series.hasEnoughHistory && (
          <span className="text-[11px] text-zinc-400 tabular-nums shrink-0">
            {series.comparableCount} ciclos
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <Metric
          value={latest!.litersPer100.toFixed(1)}
          unit="L/100km"
          label="Consumo"
        />
        <Metric
          value={latest!.bsPerKm !== null ? latest!.bsPerKm.toFixed(2) : '—'}
          unit="Bs/km"
          label="Costo por km"
        />
        <Metric
          value={latest!.bsPerLiter !== null ? latest!.bsPerLiter.toFixed(2) : '—'}
          unit="Bs/L"
          label="Precio del litro"
        />
      </div>

      {series.baseline !== null && series.comparableCount >= 2 && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-xl px-3 py-2.5 mb-5',
            series.alert ? 'bg-zinc-900' : 'bg-zinc-50/50 border border-zinc-100',
          )}
        >
          {series.alert ? (
            <AlertTriangle className="size-3.5 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <Info className="size-3.5 shrink-0 mt-0.5 text-zinc-400" />
          )}
          <p
            className={cn(
              'text-[11px] leading-relaxed',
              series.alert ? 'text-zinc-100' : 'text-zinc-500',
            )}
          >
            {series.alert ? (
              <>
                <span className="font-semibold text-white tabular-nums">
                  +{delta.toFixed(0)}%
                </span>{' '}
                frente a tu mejor ciclo ({series.baseline.toFixed(1)} L/100km).
                Puede haber una pérdida de gasolina.
              </>
            ) : (
              <>
                Tu mejor ciclo marca {series.baseline.toFixed(1)} L/100km.
                {delta > 0
                  ? ` El último va ${delta.toFixed(0)}% por encima, dentro de lo normal.`
                  : ' El consumo actual está en línea con ese mínimo.'}
              </>
            )}
          </p>
        </div>
      )}

      {series.comparableCount === 1 && (
        <p className="text-[11px] text-zinc-500 mb-5 leading-relaxed">
          Solo un ciclo con litros. Necesitamos al menos dos para comparar.
        </p>
      )}

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-[11px] font-medium text-zinc-600">
            L/100km por ciclo
          </p>
          {average !== null && series.comparableCount >= 2 && (
            <p className="text-[11px] text-zinc-400 tabular-nums">
              promedio {average.toFixed(1)}
            </p>
          )}
        </div>
        <ConsumptionBars series={{ ...series, points: visible }} />
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors mt-3"
          >
            Ver {hiddenCount} ciclo{hiddenCount > 1 ? 's' : ''} más anterior
            {hiddenCount > 1 ? 'es' : ''}
          </button>
        )}
      </div>

      {series.skippedCount > 0 && (
        <p className="text-[11px] text-zinc-400 mt-5 pt-4 border-t border-zinc-100 leading-relaxed">
          {series.skippedCount} ciclo{series.skippedCount > 1 ? 's' : ''} sin
          litros, o con muy pocos kilómetros, quedan fuera de la comparación.
        </p>
      )}
    </div>
  )
}