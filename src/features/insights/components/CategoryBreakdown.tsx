// features/insights/components/CategoryBreakdown.tsx

'use client'

import { Fragment, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, ChevronDown, Flag, Lightbulb, Minus } from 'lucide-react'
import { Anomaly, CategoryTrend } from '@/lib/insights/algorithms'
import { SpendSparkline } from '@/features/insights/components/SpendSparkline'
import { INSIGHT_TOKENS, DATA_CARD } from '@/features/insights/chart-tokens'
import { cn } from '@/lib/utils'

interface Props {
  trends    : CategoryTrend[]
  anomalies : Anomaly[]
  opportunityIds : Set<string>
  daysElapsed: number
}

type Filter = 'all' | 'up' | 'down'
type Sort  = 'delta' | 'current' | 'name'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all'   , label: 'Todas'  },
  { id: 'up'    , label: 'Subieron' },
  { id: 'down'  , label: 'Bajaron' },
]

const SORTS: { id: Sort; label: string }[] = [
  { id: 'delta'  , label: 'Cambio' },
  { id: 'current', label: 'Gasto' },
  { id: 'name'   , label: 'Nombre' },
]

const money = (n: number) =>
  new Intl.NumberFormat('es', { maximumFractionDigits: 0 }).format(n)

const MONTHS_FULL = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  return `${MONTHS_FULL[parseInt(month, 10) - 1]} ${year}`
}

/** Índice del primer mes que entra en el baseline (los 3 previos al en curso). */
/** Detalle mes a mes. Marca qué meses alimentan el baseline y cuál se proyecta. */
function CategoryDetail({ trend }: { trend: CategoryTrend }) {
  const monthly = trend.monthly
  const peak    = Math.max(...monthly.map(m => m.amount), trend.baseline, 1)

  return (
    <div className="px-5 sm:px-6 pb-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3 sm:p-4 space-y-2">

        {monthly.map((m) => {
          const isCurrent  = m.is_projected
          const barWidth   = `${(m.amount / peak) * 100}%`
          const vsBaseline = trend.baseline > 0
            ? ((m.amount - trend.baseline) / trend.baseline) * 100
            : null

          return (
            <div
              key={m.month}
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[104px_1fr_76px_56px] gap-x-3 gap-y-1 items-center"
            >
              {/* Mes */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={cn(
                  'text-[11px] truncate',
                  isCurrent ? 'font-semibold text-zinc-700' : 'text-zinc-500',
                )}>
                  {monthLabel(m.month)}
                </span>
                {isCurrent && (
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 shrink-0">
                    {m.is_complete ? 'Cerrado' : 'Actual'}
                  </span>
                )}
              </div>

              {/* Monto */}
              <div className="text-right">
                <span className={cn(
                  'text-[11px] tabular-nums',
                  isCurrent ? 'font-semibold text-zinc-900' : 'text-zinc-600',
                )}>
                  ${money(m.amount)}
                </span>
                {isCurrent && m.projected_cv != null && m.projected_cv > 0 && (
                  <span className="ml-1 text-[9px] text-zinc-400 tabular-nums">
                    ±{m.projected_cv}%
                  </span>
                )}
              </div>

              {/* Barra + marca del promedio.
                  En móvil ocupa la fila entera; en desktop va en su columna. */}
              <div className="col-span-2 sm:col-span-1 sm:order-3 relative h-3.5 rounded bg-zinc-100 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded transition-all duration-500 ease-out"
                  style={{
                    width          : barWidth,
                    backgroundColor: isCurrent
                      ? INSIGHT_TOKENS.seriesProjected
                      : INSIGHT_TOKENS.seriesPast,
                    opacity        : isCurrent ? 0.5 : 1,
                  }}
                />
                {trend.baseline > 0 && (
                  <div
                    className="absolute inset-y-0 w-px bg-zinc-900/50"
                    style={{ left: `${Math.min(100, (trend.baseline / peak) * 100)}%` }}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Δ vs promedio — solo en desktop */}
              <div className="hidden sm:block sm:order-4 text-right">
                {vsBaseline == null ? (
                  <span className="text-[11px] text-zinc-300">—</span>
                ) : (
                  <span className={cn(
                    'text-[11px] tabular-nums',
                    vsBaseline < -5  ? 'text-[#059669]'
                    : vsBaseline > 5 ? 'text-zinc-700'
                    : 'text-zinc-400',
                  )}>
                    {Math.abs(vsBaseline) < 5
                      ? '0%'
                      : `${vsBaseline > 0 ? '+' : ''}${Math.round(vsBaseline)}%`}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {/* Leyenda */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2.5 mt-1 border-t border-zinc-200">
          <div className="flex items-center gap-1.5">
            <div className="w-px h-3 bg-zinc-900/50" />
            <span className="text-[10px] text-zinc-400">
              Promedio ${money(trend.baseline)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded bg-zinc-300" />
            <span className="text-[10px] text-zinc-400">Meses que forman el promedio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded bg-zinc-400 opacity-50" />
            <span className="text-[10px] text-zinc-400">Mes en curso, proyectado</span>
          </div>
        </div>

        {/* Por qué no se extrapola, cuando no se extrapola */}
        {trend.monthly[trend.monthly.length - 1]?.is_complete && (
          <p className="text-[10px] text-zinc-400 leading-relaxed pt-1.5 border-t border-zinc-200">
            Esta categoría se gasta en un solo pago por mes, así que el monto ya
            es el del mes completo — no se extrapola.
          </p>
        )}
      </div>
    </div>
  )
}

export function CategoryBreakdown({ trends, anomalies, opportunityIds, daysElapsed }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [sort,   setSort]   = useState<Sort>('delta')
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggleRow = (id: string) =>
    setExpanded(prev => (prev === id ? null : id))

  const anomalyIds = useMemo(
    () => new Set(anomalies.map(a => a.category_id)),
    [anomalies],
  )

  const rows = useMemo(() => {
    const filtered = trends.filter(t => {
      if (filter === 'up')   return t.delta_pct > 5
      if (filter === 'down') return t.delta_pct < -5
      return true
    })

    return [...filtered].sort((a, b) => {
      if (sort === 'current') return b.current - a.current
      if (sort === 'name')    return a.category_name.localeCompare(b.category_name)
      return b.delta_pct - a.delta_pct
    })
  }, [trends, filter, sort])

  const counts = useMemo(() => ({
    all  : trends.length,
    up   : trends.filter(t => t.delta_pct >  5).length,
    down : trends.filter(t => t.delta_pct < -5).length,
  }), [trends])

  const windowMonths = trends[0]?.monthly.length ?? 0

  if (trends.length === 0) {
    return (
      <div className={cn(DATA_CARD, 'flex flex-col items-center justify-center gap-3 p-10')}>
        <div className="size-11 rounded-xl bg-zinc-100 flex items-center justify-center">
          <div className="size-2.5 rounded-full bg-zinc-300" />
        </div>
        <p className="text-sm font-medium text-zinc-900 tracking-tight">
          Sin gastos registrados
        </p>
        <p className="text-xs text-zinc-500 max-w-[34ch] text-center leading-relaxed">
          Registra gastos con categoría para comparar cada una contra tu propio promedio.
        </p>
      </div>
    )
  }

  return (
    <div className={cn(DATA_CARD, 'overflow-hidden')}>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-zinc-100">
        <div className="inline-flex items-center gap-1 rounded-xl bg-zinc-50 p-1 self-start">
          {FILTERS.map(f => {
            const count = counts[f.id]
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'px-3 h-7 rounded-lg text-xs font-medium transition-colors duration-200',
                  filter === f.id
                    ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                    : 'text-zinc-500 hover:text-zinc-900',
                )}
              >
                {f.label}
                <span className="ml-1.5 tabular-nums text-zinc-400">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Ordenar</span>
          <div className="inline-flex items-center gap-1 rounded-xl bg-zinc-50 p-1">
            {SORTS.map(s => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                className={cn(
                  'px-2.5 h-7 rounded-lg text-xs font-medium transition-colors duration-200',
                  sort === s.id
                    ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                    : 'text-zinc-500 hover:text-zinc-900',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Header row ───────────────────────────────────────────────────── */}
      <div className="hidden sm:grid grid-cols-[1fr_100px_84px_100px_72px] gap-4 px-5 sm:px-6 py-2.5 bg-zinc-50/50 border-b border-zinc-100">
        <span className="text-[11px] font-medium text-zinc-500">Categoría</span>
        <span className="text-[11px] font-medium text-zinc-500 text-right">Mes en curso</span>
        <span className="text-[11px] font-medium text-zinc-500 text-center">{windowMonths} meses</span>
        <span className="text-[11px] font-medium text-zinc-500 text-right">Promedio</span>
        <span className="text-[11px] font-medium text-zinc-500 text-right">Cambio</span>
      </div>

      {/* ── Rows ─────────────────────────────────────────────────────────── */}
      <div className="divide-y divide-zinc-100">
        {rows.map(t => {
          const key        = t.category_id
          const isExpanded = expanded === key
          const isUp    = t.delta_pct >  5
          const isDown  = t.delta_pct < -5
          const isFlat  = !isUp && !isDown
          const isAnomaly  = anomalyIds.has(t.category_id)
          const hasOpportunity = opportunityIds.has(t.category_id)

          const deltaColor = isDown
            ? 'text-[#059669]'
            : isFlat ? 'text-zinc-400' : 'text-zinc-900'

          return (
            <Fragment key={key}>
            <button
              type="button"
              onClick={() => toggleRow(key)}
              aria-expanded={isExpanded}
              className="w-full grid grid-cols-1 sm:grid-cols-[1fr_100px_84px_100px_72px] gap-x-4 gap-y-2 sm:gap-y-0 items-center px-5 sm:px-6 py-3.5 text-left transition-colors duration-200 hover:bg-zinc-50/60 focus-visible:outline-none focus-visible:bg-zinc-50"
            >
              {/* Nombre + badges */}
              <div className="flex items-center gap-2 min-w-0">
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-zinc-300 shrink-0 transition-transform duration-200',
                    isExpanded && 'rotate-180 text-zinc-500',
                  )}
                />
                <span className="text-[13px] font-semibold text-zinc-900 truncate">
                  {t.category_name}
                </span>
                {isAnomaly && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 h-5 rounded-md bg-zinc-100 text-[10px] font-medium text-zinc-600 shrink-0"
                    title={`Desvío mayor a 20% — ${t.delta_pct > 0 ? 'aumentó' : 'bajó'} ${Math.abs(t.delta_pct)}%`}
                  >
                    <Flag className="h-2.5 w-2.5" />
                    Anomalía
                  </span>
                )}
                {hasOpportunity && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 h-5 rounded-md text-[10px] font-medium shrink-0"
                    style={{ backgroundColor: `${INSIGHT_TOKENS.accent}14`, color: INSIGHT_TOKENS.accent }}
                    title="Categoría discrecional con margen de ahorro"
                  >
                    <Lightbulb className="h-2.5 w-2.5" />
                    Oportunidad
                  </span>
                )}
              </div>

              {/* Mes en curso */}
              <div className="flex items-baseline justify-between sm:block sm:text-right">
                <span className="text-[11px] text-zinc-400 sm:hidden">Mes en curso</span>
                <span className="text-[13px] font-semibold text-zinc-900 tabular-nums">
                  ${money(t.current)}
                </span>
              </div>

              {/* Sparkline */}
              <div className="flex items-center justify-center">
                <SpendSparkline monthly={t.monthly} />
              </div>

              {/* Baseline */}
              <div className="flex items-baseline justify-between sm:block sm:text-right">
                <span className="text-[11px] text-zinc-400 sm:hidden">Promedio</span>
                <span className="text-[13px] text-zinc-600 tabular-nums">
                  ${money(t.baseline)}
                </span>
              </div>

              {/* Delta — el color nunca es el único portador: siempre va flecha */}
              <div className="flex items-baseline justify-between sm:block sm:text-right">
                <span className="text-[11px] text-zinc-400 sm:hidden">Cambio</span>
                <span className={cn('inline-flex items-center justify-end gap-0.5 text-[13px] font-semibold tabular-nums', deltaColor)}>
                  {isUp    && <ArrowUpRight   className="h-3 w-3" />}
                  {isDown  && <ArrowDownRight className="h-3 w-3" />}
                  {isFlat  && <Minus          className="h-3 w-3" />}
                  {isFlat ? '0%' : `${t.delta_pct > 0 ? '+' : ''}${t.delta_pct}%`}
                </span>
              </div>
            </button>

            {isExpanded && <CategoryDetail trend={t} />}
            </Fragment>
          )
        })}
      </div>

      {rows.length === 0 && (
        <div className="px-5 sm:px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">
            Ninguna categoría cambió en esa dirección.
          </p>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 sm:px-6 py-3.5 bg-zinc-50/50 border-t border-zinc-100">
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Promedio = los 3 meses anteriores al mes en curso
          {daysElapsed > 0 && ', extrapolados al mes completo'}
        </p>
        <p className="text-[11px] text-zinc-400 shrink-0">
          {rows.length} de {trends.length} categorías
        </p>
      </div>
    </div>
  )
}