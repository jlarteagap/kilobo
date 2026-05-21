// features/insights/components/CategoryComparison.tsx

'use client'

import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { CategoryTrend } from '@/lib/insights/algorithms'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'

interface Props {
  trends: CategoryTrend[]
}

// Fallback colors for categories that don't have a color
const FALLBACK_COLORS = [
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f97316', // Orange
]

export function CategoryComparison({ trends }: Props) {
  // 1. Filtrar y preparar categorías con suficientes meses (mínimo 2)
  const validTrends = useMemo(() => {
    return trends
      .filter(t => t.monthly && t.monthly.length >= 2)
      .map((t, idx) => {
        const currentMonthSpend = t.monthly[t.monthly.length - 1]
        const previousMonthSpend = t.monthly[t.monthly.length - 2]
        
        const currentVal = currentMonthSpend?.amount ?? 0
        const prevVal = previousMonthSpend?.amount ?? 0
        const deltaVal = currentVal - prevVal
        const deltaPct = prevVal > 0 ? (deltaVal / prevVal) * 100 : 0
        
        return {
          ...t,
          currentVal,
          prevVal,
          deltaVal,
          deltaPct: Math.round(deltaPct * 10) / 10,
          color: t.category_color ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
        }
      })
      .sort((a, b) => b.currentVal - a.currentVal) // Ordenar por gasto de este mes
  }, [trends])

  // Filtrar categorías que tienen algún cambio entre ambos meses para las tarjetas
  const cardTrends = useMemo(() => {
    return validTrends.filter(t => t.deltaVal !== 0)
  }, [validTrends])

  // 2. Extraer etiquetas legibles de meses del primer elemento válido
  const { currentMonthName, previousMonthName } = useMemo(() => {
    const firstTrend = trends.find(t => t.monthly && t.monthly.length >= 2)
    if (!firstTrend) {
      return { currentMonthName: 'Este Mes', previousMonthName: 'Mes Anterior' }
    }

    const currentKey = firstTrend.monthly[firstTrend.monthly.length - 1].month
    const prevKey = firstTrend.monthly[firstTrend.monthly.length - 2].month

    const formatMonthLabel = (value: string) => {
      const [year, month] = value.split('-')
      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]
      return `${months[parseInt(month) - 1]} ${year}`
    }

    return {
      currentMonthName: formatMonthLabel(currentKey),
      previousMonthName: formatMonthLabel(prevKey),
    }
  }, [trends])

  // 3. Formatear datos para el BarChart de Recharts
  const chartData = useMemo(() => {
    // Tomamos hasta 8 categorías para que el gráfico no se sature
    return validTrends.slice(0, 8).map(t => ({
      name: t.category_name,
      [previousMonthName]: t.prevVal,
      [currentMonthName]: t.currentVal,
      color: t.color,
    }))
  }, [validTrends, currentMonthName, previousMonthName])

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('es', { maximumFractionDigits: 0 })}`

  // Renderizador personalizado premium del Tooltip con glassmorphic blur y delta
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const prevVal = payload[0].value
      const currentVal = payload[1].value
      const deltaVal = currentVal - prevVal
      const deltaPct = prevVal > 0 ? (deltaVal / prevVal) * 100 : 0
      const isUp = deltaVal > 0
      const color = payload[1].payload?.color || '#8b5cf6'

      return (
        <div className="relative overflow-hidden rounded-xl border border-muted/80 bg-card/90 backdrop-blur-md p-3.5 shadow-xl min-w-[210px] animate-in fade-in zoom-in duration-200">
          {/* Accent border bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: color }}
          />
          <div className="space-y-2.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-foreground">
              {label}
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{previousMonthName}:</span>
                <span className="font-semibold text-muted-foreground/80 font-mono">
                  {formatCurrency(prevVal)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{currentMonthName}:</span>
                <span className="font-semibold font-mono text-foreground" style={{ textShadow: `0 0 8px ${color}33` }}>
                  {formatCurrency(currentVal)}
                </span>
              </div>
            </div>
            
            <div className="border-t border-muted/20 pt-2 flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground/60 font-semibold">Variación:</span>
              {deltaVal === 0 ? (
                <span className="text-muted-foreground font-semibold">Sin cambios</span>
              ) : (
                <span className={cn(
                  "font-bold font-mono flex items-center gap-0.5",
                  isUp ? "text-red-400" : "text-emerald-400"
                )}>
                  {isUp ? '+' : ''}{Math.round(deltaPct * 10) / 10}%
                </span>
              )}
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (validTrends.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-muted/60 p-12 text-center bg-card/10 backdrop-blur-sm">
        <AlertCircle className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          Se requieren al menos 2 meses de datos de transacciones completadas para realizar una comparativa.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Gráfico de Barras Agrupadas */}
      <div className="relative overflow-hidden rounded-2xl border border-muted/40 bg-card/30 backdrop-blur-md p-5 sm:p-6 md:p-8 space-y-6 shadow-2xl shadow-indigo-950/5">
        {/* Ambient Glows */}
        <div className="absolute -left-32 -bottom-32 w-96 h-96 rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-muted/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-500 animate-pulse" />
              <h3 className="text-base font-bold tracking-tight text-foreground/90">
                Distribución Comparativa de Gastos
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Comparación directa de gastos del mes de <span className="font-semibold text-foreground/70">{currentMonthName}</span> frente a <span className="font-semibold text-foreground/70">{previousMonthName}</span>
            </p>
          </div>
          
          {/* Leyendas con estilo custom */}
          <div className="flex items-center gap-4 text-xs font-semibold self-start sm:self-auto">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-slate-400/40 border border-slate-400/60" />
              <span className="text-muted-foreground">{previousMonthName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-violet-500/80 border border-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
              <span className="text-foreground">{currentMonthName}</span>
            </div>
          </div>
        </div>

        {/* Gráfico Recharts */}
        <div className="relative z-10 h-[280px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 8, left: -24, bottom: 8 }}
              barGap={6}
            >
              <defs>
                {/* Degradados dinámicos para cada categoría en el mes actual */}
                {chartData.map((entry, index) => (
                  <linearGradient key={`grad-${index}`} id={`colorGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.12} />
                  </linearGradient>
                ))}
                {/* Degradado premium para el mes de referencia anterior */}
                <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.03} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                stroke="hsl(var(--muted))"
                strokeOpacity={0.12}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip
                content={renderCustomTooltip}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.05 }}
              />
              
              {/* Barra Mes Anterior (Benchmark - Sutil degradado pizarra con borde delicado) */}
              <Bar
                dataKey={previousMonthName}
                fill="url(#prevGrad)"
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.2}
                strokeWidth={1}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                animationDuration={1000}
              />
              
              {/* Barra Mes Actual (Glow - Degradado vibrante de categoría con borde definido) */}
              <Bar
                dataKey={currentMonthName}
                radius={[5, 5, 0, 0]}
                maxBarSize={34}
                animationDuration={1500}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#colorGrad-${index})`}
                    stroke={entry.color}
                    strokeWidth={1.5}
                    strokeOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detalle Individualizado (Tarjetas) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
            Análisis Individual por Categoría
          </h4>
        </div>

        {cardTrends.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-muted/60 p-12 text-center bg-card/10 backdrop-blur-sm">
            <HelpCircle className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No se detectaron variaciones en los gastos de tus categorías en comparación con el mes anterior.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {cardTrends.map(t => {
              const isUp = t.deltaVal > 0
              const absDeltaPct = Math.abs(t.deltaPct)
              const absDeltaVal = Math.abs(t.deltaVal)
              
              // Proporción visual para las mini barritas
              const maxVal = Math.max(t.prevVal, t.currentVal) || 1
              const prevBarWidth = `${(t.prevVal / maxVal) * 100}%`
              const currentBarWidth = `${(t.currentVal / maxVal) * 100}%`

              return (
                <div
                  key={t.category_id}
                  className="group relative overflow-hidden rounded-2xl border border-muted/40 bg-card/20 hover:bg-card/45 p-5 transition-all duration-300 hover:shadow-md hover:border-violet-500/20 flex flex-col justify-between space-y-5"
                >
                  {/* Elemento estético de fondo: resplandor sutil del color de categoría */}
                  <div
                    className="absolute -right-10 -top-10 w-24 h-24 rounded-full blur-3xl opacity-[0.04] transition-all duration-500 group-hover:scale-125"
                    style={{ backgroundColor: t.color }}
                  />

                  {/* Header Tarjeta */}
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-sm font-bold tracking-tight text-foreground/80 truncate">
                        {t.category_name}
                      </span>
                    </div>
                    
                    {/* Badge de variación */}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md border-transparent shrink-0",
                        t.deltaVal === 0
                          ? "bg-muted/50 text-muted-foreground"
                          : isUp
                          ? "bg-red-500/10 text-red-500"
                          : "bg-emerald-500/10 text-emerald-500"
                      )}
                    >
                      {t.deltaVal === 0 ? (
                        'Sin cambios'
                      ) : (
                        <span className="flex items-center gap-0.5">
                          {isUp ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {isUp ? '+' : '-'}{absDeltaPct}%
                        </span>
                      )}
                    </Badge>
                  </div>

                  {/* Importes numéricos */}
                  <div className="grid grid-cols-2 gap-4 border-t border-muted/10 pt-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold block">
                        Ant. ({previousMonthName.split(' ')[0]})
                      </span>
                      <span className="text-sm font-bold text-muted-foreground/75 tabular-nums font-mono">
                        {formatCurrency(t.prevVal)}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold block">
                        Act. ({currentMonthName.split(' ')[0]})
                      </span>
                      <span className="text-sm font-bold text-foreground/90 tabular-nums font-mono">
                        {formatCurrency(t.currentVal)}
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso comparativa unificada */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground/60 font-medium">Progreso Comparativo</span>
                      <span className={cn(
                        "font-semibold flex items-center gap-0.5",
                        isUp ? "text-rose-500" : "text-emerald-500"
                      )}>
                        {isUp ? `+${absDeltaPct}% incremento` : `-${absDeltaPct}% ahorro`}
                      </span>
                    </div>

                    <div className="relative w-full h-3 bg-muted/15 rounded-full mt-1">
                      {/* Barra Mes Anterior (Sustrato Slate de referencia) */}
                      <div
                        className="absolute left-0 top-0 h-full bg-slate-400/20 rounded-full transition-all duration-1000"
                        style={{ width: prevBarWidth }}
                      />
                      
                      {/* Barra Mes Actual (Progreso de Color) */}
                      <div
                        className={cn(
                          "absolute left-0 top-0 h-full rounded-full transition-all duration-1200",
                          isUp 
                            ? "bg-gradient-to-r from-rose-500/80 to-red-500/90 shadow-[0_0_8px_rgba(244,63,94,0.35)]" 
                            : "bg-gradient-to-r from-emerald-400/90 to-teal-500/90 shadow-[0_0_8px_rgba(16,185,129,0.35)]"
                        )}
                        style={{ width: currentBarWidth }}
                      />
                      
                      {/* Marcador del Mes Anterior (Línea blanca luminosa) */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4.5 bg-foreground/90 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.8)] z-10 transition-all duration-1000"
                        style={{ left: prevBarWidth }}
                      >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-foreground rounded-full shadow-[0_0_4px_rgba(255,255,255,1)]" />
                      </div>
                    </div>

                    {/* Leyendas numéricas de la barra */}
                    <div className="flex items-center justify-between text-[11px] font-medium pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded bg-slate-400/30" />
                        <span className="text-muted-foreground/70">
                          {previousMonthName.split(' ')[0]}: <span className="font-semibold text-muted-foreground/90 font-mono">{formatCurrency(t.prevVal)}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-2 h-2 rounded", isUp ? "bg-rose-500" : "bg-emerald-500")} />
                        <span className="text-muted-foreground/70">
                          {currentMonthName.split(' ')[0]}: <span className={cn("font-bold font-mono", isUp ? "text-rose-500" : "text-emerald-500")}>{formatCurrency(t.currentVal)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Conclusión del cambio */}
                  <div className="text-[11px] leading-relaxed text-muted-foreground/70 border-l border-muted-foreground/20 pl-2 mt-auto">
                    {t.deltaVal === 0 ? (
                      "Mantuviste exactamente el mismo nivel de gasto."
                    ) : isUp ? (
                      <span>
                        Gastaste <strong className="text-red-400 font-semibold tabular-nums">{formatCurrency(absDeltaVal)}</strong> más que el periodo anterior.
                      </span>
                    ) : (
                      <span>
                        Ahorraste <strong className="text-emerald-400 font-semibold tabular-nums">{formatCurrency(absDeltaVal)}</strong> en esta categoría.
                      </span>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
