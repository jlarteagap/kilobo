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
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import Link   from 'next/link'
import { cn } from '@/lib/utils'
import { INSIGHT_TOKENS } from '@/features/insights/chart-tokens'

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const radius      = 28
  const stroke      = 4
  const normalised  = radius - stroke / 2
  const circumference = 2 * Math.PI * normalised
  const offset      = circumference - (score / 100) * circumference

  // A/B = acento emerald, resto = zinc-800. El grado va escrito al lado.
  const ringColor = grade === 'A' || grade === 'B'
    ? INSIGHT_TOKENS.accent
    : INSIGHT_TOKENS.spend

  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width={72} height={72} className="-rotate-90">
        {/* Track */}
        <circle
          cx={36} cy={36} r={normalised}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-zinc-100"
        />
        {/* Progress */}
        <circle
          cx={36} cy={36} r={normalised}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-lg font-semibold" style={{ color: ringColor }}>
          {grade}
        </span>
        <span className="text-[10px] text-zinc-500 tabular-nums">{score}</span>
      </div>
    </div>
  )
}

function WidgetSkeleton() {
  return (
    <Card className="rounded-[22px] bg-white"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
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
      <Card className="rounded-[22px] bg-white"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
          <AlertTriangle className="h-8 w-8 text-zinc-400" />
          <p className="text-sm text-zinc-500">
            No se pudo cargar el análisis
          </p>
          <Button variant="ghost" size="sm" onClick={() => refresh()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { payload, generated_at, from_cache } = data
  const { health_score, anomalies, saving_opportunities }  = payload

  // Todo el widget se alimenta de los algoritmos determinísticos.
  const topAnomaly = anomalies[0]
  const topTip     = saving_opportunities[0]

  const generatedLabel = from_cache
    ? `Actualizado ${new Date(generated_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
    : 'Recién generado'

  return (
    <Card className="rounded-[22px] bg-white hover:shadow-md transition-shadow duration-300"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Title */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: INSIGHT_TOKENS.accent }} />
            <span className="text-sm font-semibold text-zinc-900 tracking-[-0.01em]">
              Análisis financiero
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400 hidden sm:block">
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
            <p className="text-xs font-medium text-zinc-900">
              Salud financiera
            </p>
            {/* Breakdown mini-bars */}
            {[
              { label: 'Ahorro',       value: health_score.breakdown.savings_rate },
              { label: 'Estabilidad',  value: health_score.breakdown.expense_stability },
              { label: 'Adherencia',   value: health_score.breakdown.budget_adherence },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 w-16 shrink-0">
                  {label}
                </span>
                <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width          : `${Math.min(value, 100)}%`,
                      backgroundColor: INSIGHT_TOKENS.spend,
                    }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 w-6 text-right tabular-nums">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-100" />

        {/* Top Anomaly */}
        {topAnomaly && (
          <div className="rounded-xl px-3 py-2.5 flex items-start gap-3 bg-zinc-50 border border-zinc-200">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-zinc-500" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium truncate text-zinc-900">
                  {topAnomaly.category_name}
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px] px-1.5 py-0 h-4 shrink-0',
                    topAnomaly.delta_pct > 0 ? 'text-zinc-800' : 'text-[#059669]',
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
              <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                ${Math.round(topAnomaly.current_amount)} este mes contra un promedio de $
                {Math.round(topAnomaly.baseline_amount)}
              </p>
            </div>
          </div>
        )}

        {/* Top Tip */}
        {topTip && (
          <div
            className="rounded-xl px-3 py-2.5 flex items-start gap-3 border"
            style={{
              backgroundColor : `${INSIGHT_TOKENS.accent}0D`,
              borderColor     : `${INSIGHT_TOKENS.accent}26`,
            }}
          >
            <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" style={{ color: INSIGHT_TOKENS.accent }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-900">
                {topTip.category_name}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                Ahorrar ~${Math.round(topTip.potential_saving)}/mes
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        <Link href="/insights">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-zinc-500 hover:text-zinc-900 group"
          >
            Ver análisis completo
            <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>

      </CardContent>
    </Card>
  )
}