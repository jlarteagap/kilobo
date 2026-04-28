// app/insights/page.tsx

'use client'

import { useInsights, useRefreshInsights } from '@/features/insights/hooks/useInsights'
import { HealthScoreGauge }  from '@/features/insights/components/HealthScoreGauge'
import { AnomalyCard }       from '@/features/insights/components/AnomalyCard'
import { SavingsTipCard }    from '@/features/insights/components/SavingsTipCard'
import { TrendChart }        from '@/features/insights/components/TrendChart'
import { Button }            from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton }          from '@/components/ui/skeleton'
import { Badge }             from '@/components/ui/badge'
import {
  RefreshCw, Sparkles, TrendingUp,
  AlertTriangle, Lightbulb, MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import AppLayout from "@/components/layout/AppLayout"

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const months  = 3
  const { data, isLoading, isError } = useInsights(months)
  const { mutate: refresh, isPending: isRefreshing } = useRefreshInsights(months)

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
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16 space-y-12 md:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-muted/40 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-xl">
              <Sparkles className="h-6 w-6 text-violet-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground/90">
              Insights Financieros
            </h1>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-sm md:text-base">
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
          size="lg"
          onClick={() => refresh()}
          disabled={isRefreshing}
          className="rounded-xl border-muted-foreground/20 hover:bg-muted/50 transition-all duration-300 h-11 px-6"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2 text-muted-foreground', isRefreshing && 'animate-spin')} />
          {isRefreshing ? 'Analizando…' : 'Regenerar análisis'}
        </Button>
      </div>

      {/* ── AI Summary ──────────────────────────────────────────────────── */}
      {ai_insights?.summary && (
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.03] to-transparent p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 shrink-0">
              <MessageSquare className="h-4 w-4" />
            </div>
            <p className="text-base md:text-lg leading-relaxed text-foreground/80 font-medium italic">
              "{ai_insights.summary}"
            </p>
          </div>
        </div>
      )}

      {/* ── Principal Metrics Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        
        {/* ── Health Score ─────────────────────────────────────────────────── */}
        <Section
          icon={<Sparkles className="h-3.5 w-3.5" />}
          title="Salud financiera"
          description="Ahorro, estabilidad y control de gastos"
        >
          <div className="rounded-2xl border border-muted/40 bg-card/30 backdrop-blur-sm p-6 md:p-8 h-full flex flex-col justify-center">
            <HealthScoreGauge
              score={health_score.score}
              grade={health_score.grade}
              breakdown={health_score.breakdown}
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
          <div className="rounded-2xl border border-muted/40 bg-card/30 backdrop-blur-sm p-6 md:p-8 h-full">
            <TrendChart trends={trends} maxLines={4} />
          </div>
        </Section>
      </div>

      {/* ── Category Pills ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 px-1">
        {trends.slice(0, 8).map(trend => (
          <div
            key={trend.category_id}
            className="flex items-center gap-2 rounded-full border border-muted/60
                       bg-muted/10 px-4 py-2 text-xs font-medium transition-colors hover:bg-muted/20"
          >
            {trend.category_color && (
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: trend.category_color }}
              />
            )}
            <span className="text-foreground/70">{trend.category_name}</span>
            <span className={cn(
              'font-bold',
              trend.trend === 'up'   ? 'text-red-500'
              : trend.trend === 'down' ? 'text-emerald-500'
              : 'text-muted-foreground',
            )}>
              {trend.delta_pct > 0 ? '+' : ''}{trend.delta_pct}%
            </span>
          </div>
        ))}
      </div>

      {/* ── Anomalies and Savings List ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">
        
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
              {anomalies.map(anomaly => (
                <AnomalyCard
                  key={anomaly.category_id}
                  anomaly={anomaly}
                  aiExplanation={ai_insights?.anomaly_explanations?.find(
                    a => a.category_id === anomaly.category_id
                  )}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-muted/60 p-12 text-center">
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
            <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-6 flex items-center justify-between mt-6">
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600/70">Potencial Total</p>
                <p className="text-sm text-muted-foreground">Ahorro mensual estimado</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600 tabular-nums">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-8 border-t border-muted/40">
        {ai_insights?.projection && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground/80 px-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <h2 className="text-sm font-medium uppercase tracking-wider">Proyección próxima</h2>
            </div>
            <div className="rounded-2xl border border-muted/40 bg-card/30 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gasto estimado</p>
                  <p className="text-4xl font-bold tracking-tight tabular-nums">
                    ${ai_insights.projection.next_month_estimate.toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/10">
                  {ai_insights.projection.confidence === 'high' ? 'Alta confianza'
                   : ai_insights.projection.confidence === 'medium' ? 'Confianza media'
                   : 'Estimación'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {ai_insights.projection.narrative}
              </p>
            </div>
          </div>
        )}

        {ai_insights?.motivation && (
          <div className="h-full flex flex-col justify-center p-8 md:p-12">
            <blockquote className="space-y-4">
              <p className="text-xl md:text-2xl font-medium text-foreground/70 leading-snug italic">
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