// features/insights/components/InsightsWidget.tsx

'use client'

import { useInsights, useRefreshInsights } from '../hooks/useInsights'
import { Card, CardContent, CardHeader }   from '@/components/ui/card'
import { Button }                          from '@/components/ui/button'
import { Badge }                           from '@/components/ui/badge'
import { Skeleton }                        from '@/components/ui/skeleton'
import {
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import Link   from 'next/link'
import { cn } from '@/lib/utils'

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const radius      = 28
  const stroke      = 4
  const normalised  = radius - stroke / 2
  const circumference = 2 * Math.PI * normalised
  const offset      = circumference - (score / 100) * circumference

  const gradeColor =
    grade === 'A' ? '#22c55e'
    : grade === 'B' ? '#84cc16'
    : grade === 'C' ? '#eab308'
    : grade === 'D' ? '#f97316'
    : '#ef4444'

  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width={72} height={72} className="-rotate-90">
        {/* Track */}
        <circle
          cx={36} cy={36} r={normalised}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/20"
        />
        {/* Progress */}
        <circle
          cx={36} cy={36} r={normalised}
          fill="none"
          stroke={gradeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-lg font-bold" style={{ color: gradeColor }}>
          {grade}
        </span>
        <span className="text-[10px] text-muted-foreground">{score}</span>
      </div>
    </div>
  )
}

function WidgetSkeleton() {
  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-[72px] w-[72px] rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </CardContent>
    </Card>
  )
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function InsightsWidget({ months = 3 }: { months?: number }) {
  const { data, isLoading, isError } = useInsights(months)
  const { mutate: refresh, isPending: isRefreshing } = useRefreshInsights(months)

  if (isLoading) return <WidgetSkeleton />

  if (isError || !data) {
    return (
      <Card className="border border-border/50 bg-card/50">
        <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No se pudo cargar el análisis
          </p>
          <Button variant="ghost" size="sm" onClick={() => refresh()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { payload, ai_insights, generated_at, from_cache } = data
  const { health_score, anomalies, saving_opportunities }  = payload

  // Tomar la anomalía más severa y el mejor tip
  const topAnomaly = anomalies[0]
  const topTip     = ai_insights?.saving_tips?.[0]
    ?? (saving_opportunities[0]
      ? { tip: saving_opportunities[0].insight, category_id: saving_opportunities[0].category_id }
      : null)

  const generatedLabel = from_cache
    ? `Actualizado ${new Date(generated_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
    : 'Recién generado'

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Title */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-semibold tracking-tight">
              Análisis financiero
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              {generatedLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => refresh()}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">

        {/* Health Score Row */}
        <div className="flex items-center gap-4">
          <ScoreRing
            score={health_score.score}
            grade={health_score.grade}
          />
          <div className="flex-1 space-y-1.5">
            <p className="text-xs font-medium text-foreground">
              Salud financiera
            </p>
            {/* Breakdown mini-bars */}
            {[
              { label: 'Ahorro',       value: health_score.breakdown.savings_rate },
              { label: 'Estabilidad',  value: health_score.breakdown.expense_stability },
              { label: 'Adherencia',   value: health_score.breakdown.budget_adherence },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-16 shrink-0">
                  {label}
                </span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(value, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-6 text-right">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50" />

        {/* Top Anomaly */}
        {topAnomaly && (
          <div className={cn(
            'rounded-xl px-3 py-2.5 flex items-start gap-3',
            topAnomaly.severity === 'high'   && 'bg-red-500/8 border border-red-500/20',
            topAnomaly.severity === 'medium' && 'bg-amber-500/8 border border-amber-500/20',
            topAnomaly.severity === 'low'    && 'bg-blue-500/8 border border-blue-500/20',
          )}>
            <AlertTriangle className={cn(
              'h-4 w-4 mt-0.5 shrink-0',
              topAnomaly.severity === 'high'   && 'text-red-500',
              topAnomaly.severity === 'medium' && 'text-amber-500',
              topAnomaly.severity === 'low'    && 'text-blue-500',
            )} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium truncate">
                  {topAnomaly.category_name}
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px] px-1.5 py-0 h-4 shrink-0',
                    topAnomaly.delta_pct > 0 ? 'text-red-600' : 'text-green-600',
                  )}
                >
                  {topAnomaly.delta_pct > 0 ? (
                    <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" />
                  )}
                  {Math.abs(topAnomaly.delta_pct)}%
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                {ai_insights?.anomaly_explanations?.find(
                  a => a.category_id === topAnomaly.category_id
                )?.explanation ?? `$${topAnomaly.current_amount} vs $${topAnomaly.average_amount} promedio`}
              </p>
            </div>
          </div>
        )}

        {/* Top Tip */}
        {topTip && (
          <div className="rounded-xl px-3 py-2.5 flex items-start gap-3 bg-emerald-500/8 border border-emerald-500/20">
            <Lightbulb className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">Tip de ahorro</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                {topTip.tip}
              </p>
            </div>
          </div>
        )}

        {/* Projection preview */}
        {ai_insights?.projection && (
          <div className="rounded-xl px-3 py-2.5 flex items-center gap-3 bg-muted/40">
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground flex-1 line-clamp-1">
              {ai_insights.projection.narrative}
            </p>
            <span className="text-xs font-semibold text-foreground shrink-0">
              ${ai_insights.projection.next_month_estimate.toLocaleString()}
            </span>
          </div>
        )}

        {/* CTA */}
        <Link href="/insights">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground group"
          >
            Ver análisis completo
            <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>

      </CardContent>
    </Card>
  )
}