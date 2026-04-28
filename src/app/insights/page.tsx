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

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon, title, description, badge, children,
}: {
  icon        : React.ReactNode
  title       : string
  description?: string
  badge?      : string
  children    : React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl
                          bg-muted/60 text-foreground shrink-0">
            {icon}
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {badge && (
          <Badge variant="secondary" className="text-xs shrink-0">{badge}</Badge>
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PageSkeleton />
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError || !data) {
    return (
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
    )
  }

  const { payload, ai_insights, generated_at, from_cache } = data
  const { health_score, trends, anomalies, saving_opportunities } = payload

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <h1 className="text-2xl font-bold tracking-tight">Análisis financiero</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Últimos {months} meses ·{' '}
            <span className={from_cache ? 'text-muted-foreground' : 'text-emerald-500 font-medium'}>
              {from_cache
                ? `Actualizado ${new Date(generated_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`
                : 'Recién generado'}
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={isRefreshing}
          className="shrink-0"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
          {isRefreshing ? 'Analizando…' : 'Regenerar'}
        </Button>
      </div>

      {/* ── AI Summary ──────────────────────────────────────────────────── */}
      {ai_insights?.summary && (
        <Card className="border-violet-500/20 bg-violet-500/5">
          <CardContent className="flex items-start gap-3 pt-5">
            <MessageSquare className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed text-foreground/85">
              {ai_insights.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Health Score ─────────────────────────────────────────────────── */}
      <Section
        icon={<Sparkles className="h-4 w-4" />}
        title="Salud financiera"
        description="Basado en ahorro, estabilidad y control de gastos"
      >
        <Card>
          <CardContent className="pt-6">
            <HealthScoreGauge
              score={health_score.score}
              grade={health_score.grade}
              breakdown={health_score.breakdown}
            />
          </CardContent>
        </Card>
      </Section>

      {/* ── Tendencias ───────────────────────────────────────────────────── */}
      <Section
        icon={<TrendingUp className="h-4 w-4" />}
        title="Tendencias por categoría"
        description="Evolución mensual de tus principales gastos"
        badge={`${trends.length} categorías`}
      >
        <Card>
          <CardContent className="pt-6">
            <TrendChart trends={trends} maxLines={4} />
          </CardContent>
        </Card>

        {/* Trend summary pills */}
        <div className="flex flex-wrap gap-2">
          {trends.slice(0, 6).map(trend => (
            <div
              key={trend.category_id}
              className="flex items-center gap-1.5 rounded-full border border-border/60
                         bg-card px-3 py-1.5 text-xs"
            >
              {trend.category_color && (
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: trend.category_color }}
                />
              )}
              <span className="font-medium">{trend.category_name}</span>
              <span className={cn(
                'font-semibold',
                trend.trend === 'up'   ? 'text-red-500'
                : trend.trend === 'down' ? 'text-green-500'
                : 'text-muted-foreground',
              )}>
                {trend.delta_pct > 0 ? '+' : ''}{trend.delta_pct}%
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Anomalías ────────────────────────────────────────────────────── */}
      {anomalies.length > 0 && (
        <Section
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Anomalías detectadas"
          description="Gastos que se desvían significativamente de tu promedio"
          badge={`${anomalies.length} ${anomalies.length === 1 ? 'alerta' : 'alertas'}`}
        >
          <div className="space-y-3">
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
        </Section>
      )}

      {/* ── Tips de ahorro ───────────────────────────────────────────────── */}
      {saving_opportunities.length > 0 && (
        <Section
          icon={<Lightbulb className="h-4 w-4" />}
          title="Oportunidades de ahorro"
          description="Acciones concretas para mejorar tu salud financiera"
        >
          <div className="space-y-3">
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
          </div>

          {/* Total potential saving */}
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="flex items-center justify-between pt-4 pb-4">
              <div>
                <p className="text-sm font-semibold">Potencial de ahorro total</p>
                <p className="text-xs text-muted-foreground">Si aplicas todos los tips</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-600">
                  ${saving_opportunities
                    .reduce((acc, o) => acc + o.potential_saving, 0)
                    .toLocaleString()}/mes
                </p>
                <p className="text-xs text-emerald-600/70">
                  ~${(saving_opportunities.reduce((acc, o) => acc + o.potential_saving, 0) * 12).toLocaleString()}/año
                </p>
              </div>
            </CardContent>
          </Card>
        </Section>
      )}

      {/* ── Proyección ───────────────────────────────────────────────────── */}
      {ai_insights?.projection && (
        <Section
          icon={<TrendingUp className="h-4 w-4" />}
          title="Proyección próximo mes"
          description={ai_insights.projection.narrative}
          badge={ai_insights.projection.confidence === 'high' ? 'Alta confianza'
               : ai_insights.projection.confidence === 'medium' ? 'Confianza media'
               : 'Estimación aproximada'}
        >
          <Card>
            <CardContent className="flex items-center justify-between pt-6 pb-6">
              <div>
                <p className="text-sm text-muted-foreground">Gasto estimado</p>
                <p className="text-3xl font-bold tabular-nums mt-1">
                  ${ai_insights.projection.next_month_estimate.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">vs este mes</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  ${payload.total_expenses.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </Section>
      )}

      {/* ── Motivación IA ────────────────────────────────────────────────── */}
      {ai_insights?.motivation && (
        <p className="text-center text-sm text-muted-foreground italic px-8 pb-4">
          "{ai_insights.motivation}"
        </p>
      )}

    </div>
  )
}