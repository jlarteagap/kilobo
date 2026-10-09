// app/insights/page.tsx

'use client'

import { useMemo } from 'react'
import { useInsights, useRefreshInsights } from '@/features/insights/hooks/useInsights'
import { HealthScoreGauge }  from '@/features/insights/components/HealthScoreGauge'
import { CategoryBreakdown } from '@/features/insights/components/CategoryBreakdown'
import { Button }            from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton }          from '@/components/ui/skeleton'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DATA_CARD } from '@/features/insights/chart-tokens'
import AppLayout from '@/components/layout/AppLayout'

const MONTHS = 6

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function BreakdownSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={cn(DATA_CARD, 'overflow-hidden')}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <Skeleton className="h-7 w-56 rounded-lg bg-zinc-100" />
        <Skeleton className="h-7 w-40 rounded-lg bg-zinc-100" />
      </div>
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_100px_84px_100px_72px] gap-4 px-6 py-3.5 items-center">
            <Skeleton className="h-4 rounded bg-zinc-100" style={{ width: `${45 + (i % 3) * 12}%` }} />
            <Skeleton className="h-4 rounded bg-zinc-100 ml-auto w-16" />
            <Skeleton className="h-6 rounded bg-zinc-100 mx-auto w-[76px]" />
            <Skeleton className="h-4 rounded bg-zinc-100 ml-auto w-16" />
            <Skeleton className="h-4 rounded bg-zinc-100 ml-auto w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-10 sm:space-y-14 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56 rounded-lg bg-zinc-100" />
        <Skeleton className="h-4 w-72 rounded bg-zinc-100" />
      </div>
      <Skeleton className="h-56 w-full rounded-[22px] bg-zinc-100" />
      <BreakdownSkeleton />
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  title, description, children
}: {
  title       : string
  description : string
  children    : React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[13px] font-semibold text-zinc-900 tracking-tight">
          {title}
        </h2>
        <p className="text-xs text-zinc-500 capitalize">{description}</p>
      </div>
      {children}
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const { data, isLoading, isError } = useInsights(MONTHS)
  const { mutate: refresh, isPending: isRefreshing } = useRefreshInsights(MONTHS)

  // Los badges de "Oportunidad" salen de las oportunidades ya calculadas —
  // no son información nueva, es un filtro sobre las mismas filas.
  const opportunityIds = useMemo(
    () => new Set(data?.payload.saving_opportunities.map(o => o.category_id) ?? []),
    [data?.payload.saving_opportunities],
  )

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
          <PageSkeleton />
        </div>
      </AppLayout>
    )
  }

  if (isError || !data) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="rounded-[22px] border-dashed border-zinc-300 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="size-11 rounded-xl bg-zinc-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-zinc-900">No se pudo generar el análisis</p>
                <p className="text-xs text-zinc-500">Verifica tu conexión e inténtalo de nuevo</p>
              </div>
              <Button
                onClick={() => refresh()}
                disabled={isRefreshing}
                className="rounded-xl bg-[#059669] hover:bg-[#047857] text-white"
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  const { payload, generated_at, from_cache } = data
  const { health_score, trends, anomalies, days_elapsed } = payload

  const updatedLabel = from_cache
    ? `actualizado el ${new Date(generated_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`
    : 'recién generado'

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16 space-y-10 sm:space-y-14 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-7 border-b border-zinc-200">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight">
              Insights
            </h1>
            <p className="text-sm text-zinc-500 capitalize">
              Últimos {MONTHS} meses · {updatedLabel}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refresh()}
            disabled={isRefreshing}
            className="rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors duration-200 h-10 px-5 text-sm w-full sm:w-auto"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2 text-zinc-500', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Analizando…' : 'Regenerar'}
          </Button>
        </div>

        {/* ── Salud financiera ────────────────────────────────────────── */}
        <Section
          title="Salud financiera"
          description={`Ahorro, estabilidad y control sobre ${MONTHS} meses`}
        >
          <div className={cn(DATA_CARD, 'p-5 sm:p-8')}>
            <HealthScoreGauge
              score    ={health_score.score}
              grade    ={health_score.grade}
              breakdown={health_score.breakdown}
            />
          </div>
        </Section>

        {/* ── Gasto por categoría — el artefacto único ────────────────── */}
        <Section
          title="Gasto por categoría"
          description={
            days_elapsed > 0
              ? `Mes en curso (día ${days_elapsed}) contra el promedio de los 3 meses previos`
              : 'Mes cerrado contra el promedio de los 3 meses previos'
          }
        >
          <CategoryBreakdown
            trends         ={trends}
            anomalies      ={anomalies}
            opportunityIds ={opportunityIds}
            daysElapsed    ={days_elapsed}
          />
        </Section>

      </div>
    </AppLayout>
  )
}