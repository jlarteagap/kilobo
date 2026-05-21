// app/insights/page.tsx

'use client'

import { useInsights, useRefreshInsights } from '@/features/insights/hooks/useInsights'
import { AIInsights }         from '@/lib/insights/ai-narrator'
import { HealthScoreGauge }  from '@/features/insights/components/HealthScoreGauge'
import { AnomalyCard }       from '@/features/insights/components/AnomalyCard'
import { SavingsTipCard }    from '@/features/insights/components/SavingsTipCard'
import { TrendChart }        from '@/features/insights/components/TrendChart'
import { Button }            from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton }          from '@/components/ui/skeleton'
import { Badge }             from '@/components/ui/badge'
import {
  RefreshCw, Sparkles, TrendingUp,
  AlertTriangle, Lightbulb, MessageSquare,
  Layers, ChevronDown, BarChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import AppLayout from "@/components/layout/AppLayout"
import { CategoryComparison } from '@/features/insights/components/CategoryComparison'
import { useMemo, useState } from 'react'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis,
} from 'recharts'

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-80 w-full rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon, title, description, badge, children, className
}: {
  icon        : React.ReactNode
  title       : string
  description?: string
  badge?      : string
  children    : React.ReactNode
  className?  : string
}) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="flex items-end justify-between px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground/80">
            {icon}
            <h2 className="text-sm font-medium uppercase tracking-wider">{title}</h2>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground/60 leading-tight">{description}</p>
          )}
        </div>
        {badge && (
          <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold px-2 py-0 h-5 bg-muted/30 border-muted-foreground/10">
            {badge}
          </Badge>
        )}
      </div>
      {children}
    </section>
  )
}

// ─── Anomaly Cluster Accordion ─────────────────────────────────────────────────

const CLUSTER_COLORS = [
  '#f97316', '#06b6d4', '#ec4899', '#8b5cf6', '#10b981',
]

function AnomalyClusterCard({ cluster, index }: {
  cluster: AIInsights['anomaly_clusters'][number]
  index: number
}) {
  const [open, setOpen] = useState(false)
  const color = CLUSTER_COLORS[index % CLUSTER_COLORS.length]
  const severityColor = cluster.severity === 'high' ? 'text-red-500'
    : cluster.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'

  return (
    <div className="rounded-2xl border border-muted/40 bg-card/10 transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground/80 truncate">{cluster.name}</p>
            <p className="text-xs text-muted-foreground/60 truncate">{cluster.category_ids.length} categorías relacionadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('text-[10px] uppercase tracking-widest font-bold', severityColor)}>
            {cluster.severity === 'high' ? 'Crítico' : cluster.severity === 'medium' ? 'Moderado' : 'Leve'}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground/40 transition-transform duration-300', open && 'rotate-180')} />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 rounded-xl p-4">
            {cluster.explanation}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Extended Projection Sparkline ─────────────────────────────────────────────

function ProjectionSparkline({ data }: {
  data: AIInsights['projection_extended']['monthly']
}) {
  if (!data.length) return null

  const formatMonth = (value: string) => {
    const [year, month] = value.split('-')
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${months[parseInt(month) - 1]}`
  }

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('es', { maximumFractionDigits: 0 })}`

  const last = data[data.length - 1].estimate
  const first = data[0].estimate
  const trend = last >= first ? 'up' : 'down'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
          Proyección extendida
        </span>
        <span className={cn(
          'text-[10px] font-bold',
          trend === 'up' ? 'text-red-400' : 'text-emerald-400',
        )}>
          {trend === 'up' ? '↑ Tendencia al alza' : '↓ Tendencia a la baja'}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false} tickLine={false}
            dy={6}
          />
          <YAxis hide domain={['dataMin - 200', 'dataMax + 200']} />
          <Area
            type="monotone"
            dataKey="estimate"
            stroke="hsl(var(--violet-500))"
            strokeWidth={1.5}
            fill="url(#projGrad)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const months  = 3
  const { data, isLoading, isError } = useInsights(months)
  const { mutate: refresh, isPending: isRefreshing } = useRefreshInsights(months)

  // ── Build cluster map ──────────────────────────────────────────────────────
  const categoryToCluster = useMemo(() => {
    const map = new Map<string, { name: string; index: number }>()
    if (!data?.ai_insights?.anomaly_clusters) return map
    data.ai_insights.anomaly_clusters.forEach((cluster, index) => {
      cluster.category_ids.forEach(id => {
        map.set(id, { name: cluster.name, index })
      })
    })
    return map
  }, [data?.ai_insights?.anomaly_clusters])

  // ── Find chart annotation ──────────────────────────────────────────────────
  const trendAnnotation = useMemo(() => {
    if (!data?.ai_insights?.chart_annotations) return undefined
    return data.ai_insights.chart_annotations.find(a => a.chart_id === 'trend_chart')?.annotation
  }, [data?.ai_insights?.chart_annotations])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <PageSkeleton />
        </div>
      </AppLayout>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError || !data) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <AlertTriangle className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">No se pudo generar el análisis</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Verifica tu conexión e inténtalo de nuevo
                </p>
              </div>
              <Button onClick={() => refresh()} disabled={isRefreshing}>
                <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  const { payload, ai_insights, generated_at, from_cache } = data
  const { health_score, trends, anomalies, saving_opportunities } = payload

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16 space-y-10 sm:space-y-12 md:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 sm:gap-6 border-b border-muted/40 pb-6 sm:pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-xl">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-violet-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground/90">
              Insights Financieros
            </h1>
          </div>
          <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm md:text-base">
            Período de {months} meses
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className={cn(
              "px-2 py-0.5 rounded-md text-xs font-medium",
              from_cache ? "bg-muted/50 text-muted-foreground" : "bg-emerald-500/10 text-emerald-600"
            )}>
              {from_cache
                ? `Actualizado el ${new Date(generated_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`
                : 'Recién generado'}
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          size="default"
          onClick={() => refresh()}
          disabled={isRefreshing}
          className="rounded-xl border-muted-foreground/20 hover:bg-muted/50 transition-all duration-300 h-10 sm:h-11 px-5 sm:px-6 text-sm w-full sm:w-auto"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2 text-muted-foreground', isRefreshing && 'animate-spin')} />
          {isRefreshing ? 'Analizando…' : 'Regenerar análisis'}
        </Button>
      </div>

      {/* ── AI Summary ──────────────────────────────────────────────────── */}
      {ai_insights?.summary && (
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-transparent p-5 sm:p-6 md:p-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="mt-1 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 shrink-0">
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-foreground/80 font-medium italic">
              "{ai_insights.summary}"
            </p>
          </div>
        </div>
      )}

      {/* ── Principal Metrics Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12">

        {/* ── Health Score ─────────────────────────────────────────────────── */}
        <Section
          icon={<Sparkles className="h-3.5 w-3.5" />}
          title="Salud financiera"
          description="Ahorro, estabilidad y control de gastos"
        >
          <div className="rounded-2xl border border-muted/40 bg-card/30 backdrop-blur-sm p-4 sm:p-6 md:p-8 h-full flex flex-col justify-center">
            <HealthScoreGauge
              score={health_score.score}
              grade={health_score.grade}
              breakdown={health_score.breakdown}
              aiExplanation={ai_insights?.health_score_change}
            />
          </div>
        </Section>

        {/* ── Tendencias ───────────────────────────────────────────────────── */}
        <Section
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          title="Gastos por categoría"
          description="Evolución mensual"
          badge={`${trends.length} categorías`}
        >
          <div className="rounded-2xl border border-muted/40 bg-card/30 backdrop-blur-sm p-4 sm:p-6 md:p-8 h-full">
            <TrendChart trends={trends} maxLines={4} annotation={trendAnnotation} />
          </div>
        </Section>
      </div>



      {/* ── Comparativa con el Mes Anterior ─────────────────────────────── */}
      <Section
        icon={<BarChart className="h-3.5 w-3.5" />}
        title="Comparativa mensual"
        description="Variación de tus gastos en cada categoría con respecto al mes anterior"
        badge={`${trends.filter(t => t.monthly && t.monthly.length >= 2).length} categorías`}
      >
        <CategoryComparison trends={trends} />
      </Section>

      {/* ── Anomaly Clusters ──────────────────────────────────────────────── */}
      {ai_insights?.anomaly_clusters && ai_insights.anomaly_clusters.length > 0 && (
        <Section
          icon={<Layers className="h-3.5 w-3.5" />}
          title="Patrones detectados"
          description="Grupos de anomalías relacionadas"
          badge={`${ai_insights.anomaly_clusters.length} patrones`}
        >
          <div className="space-y-3">
            {ai_insights.anomaly_clusters.map((cluster, i) => (
              <AnomalyClusterCard key={cluster.name} cluster={cluster} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Anomalies and Savings List ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-16">

        {/* ── Anomalías ────────────────────────────────────────────────────── */}
        <Section
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          title="Anomalías"
          description="Desvíos significativos"
          badge={anomalies.length > 0 ? `${anomalies.length} alertas` : undefined}
          className={cn(anomalies.length === 0 && "opacity-40 grayscale")}
        >
          {anomalies.length > 0 ? (
            <div className="space-y-4">
              {anomalies.map(anomaly => {
                const cluster = categoryToCluster.get(anomaly.category_id)
                return (
                  <AnomalyCard
                    key={anomaly.category_id}
                    anomaly={anomaly}
                    aiExplanation={ai_insights?.anomaly_explanations?.find(
                      a => a.category_id === anomaly.category_id
                    )}
                    clusterName={cluster?.name}
                    clusterColor={cluster ? CLUSTER_COLORS[cluster.index % CLUSTER_COLORS.length] : undefined}
                  />
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-muted/60 p-10 sm:p-12 text-center">
              <p className="text-sm text-muted-foreground">No se detectaron anomalías este período</p>
            </div>
          )}
        </Section>

        {/* ── Tips de ahorro ───────────────────────────────────────────────── */}
        <Section
          icon={<Lightbulb className="h-3.5 w-3.5" />}
          title="Oportunidades"
          description="Acciones recomendadas"
        >
          <div className="space-y-4">
            {saving_opportunities.map((opp, i) => (
              <SavingsTipCard
                key={opp.category_id}
                opportunity={opp}
                aiTip={ai_insights?.saving_tips?.find(
                  t => t.category_id === opp.category_id
                )}
                rank={i + 1}
              />
            ))}

            {/* Total potential saving pill */}
            <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-4 sm:p-6 flex items-center justify-between mt-4 sm:mt-6">
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600/70">Potencial Total</p>
                <p className="text-sm text-muted-foreground">Ahorro mensual estimado</p>
              </div>
              <div className="text-right">
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 tabular-nums">
                  ${saving_opportunities
                    .reduce((acc, o) => acc + o.potential_saving, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ── Proyección & Motivación ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start pt-6 sm:pt-8 border-t border-muted/40">

        {/* ── Projection Card (simple + extended) ──────────────────────────── */}
        {ai_insights?.projection && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground/80 px-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <h2 className="text-sm font-medium uppercase tracking-wider">Proyección</h2>
            </div>
            <div className="rounded-2xl border border-muted/40 bg-card/30 p-5 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gasto estimado próximo mes</p>
                  <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
                    ${ai_insights.projection.next_month_estimate.toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/10 self-start sm:self-auto">
                  {ai_insights.projection.confidence === 'high' ? 'Alta confianza'
                   : ai_insights.projection.confidence === 'medium' ? 'Confianza media'
                   : 'Estimación'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {ai_insights.projection.narrative}
              </p>

              {/* Extended projection sparkline */}
              {ai_insights?.projection_extended?.monthly && ai_insights.projection_extended.monthly.length > 1 && (
                <>
                  <div className="border-t border-muted/30 pt-6">
                    <ProjectionSparkline data={ai_insights.projection_extended.monthly} />
                  </div>
                  {ai_insights.projection_extended.narrative && (
                    <p className="text-xs text-muted-foreground/70 leading-relaxed italic border-l-2 border-violet-500/30 pl-3">
                      {ai_insights.projection_extended.narrative}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Motivación ────────────────────────────────────────────────── */}
        {ai_insights?.motivation && (
          <div className="h-full flex flex-col justify-center p-5 sm:p-8 md:p-12">
            <blockquote className="space-y-4">
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-foreground/70 leading-snug italic">
                "{ai_insights.motivation}"
              </p>
              <footer className="flex items-center gap-3">
                <div className="h-px w-8 bg-muted-foreground/20" />
                <cite className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 not-italic">
                  Tu Asistente AI
                </cite>
              </footer>
            </blockquote>
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  )
}
