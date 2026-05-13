// features/insights/components/SavingsTipCard.tsx

'use client'

import { SavingOpportunity }   from '@/lib/insights/algorithms'
import { AIInsights }          from '@/lib/insights/ai-narrator'
import { Lightbulb, TrendingDown } from 'lucide-react'
import { cn }                  from '@/lib/utils'
import { Badge }               from '@/components/ui/badge'

interface Props {
  opportunity : SavingOpportunity
  aiTip?      : AIInsights['saving_tips'][number]
  rank        : number
}

const FEASIBILITY = {
  alta : { label: 'Alta',  class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15' },
  media: { label: 'Media', class: 'bg-amber-500/10 text-amber-600 border-amber-500/15' },
  baja : { label: 'Baja',  class: 'bg-muted/30 text-muted-foreground border-muted-foreground/10' },
}

export function SavingsTipCard({ opportunity, aiTip, rank }: Props) {
  const saving    = aiTip?.estimated_monthly_saving ?? opportunity.potential_saving
  const tip       = aiTip?.tip ?? opportunity.insight
  const feas      = aiTip?.feasibility
  const feasStyle = feas ? FEASIBILITY[feas] : null

  return (
    <div className="group rounded-2xl border border-muted/40 bg-card/10 p-6 transition-all duration-300 hover:shadow-sm hover:border-emerald-500/20 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-500/10">
            {rank}
          </div>
          <div className="flex items-center gap-2">
            {opportunity.category_color && (
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: opportunity.category_color }}
              />
            )}
            <span className="text-sm font-bold tracking-tight text-foreground/80">{opportunity.category_name}</span>
          </div>
          {feasStyle && (
            <Badge variant="outline" className={cn('text-[10px] uppercase tracking-widest font-bold px-2 py-0 h-5', feasStyle.class)}>
              {feasStyle.label}
            </Badge>
          )}
        </div>

        <div className="flex flex-col items-end">
          <span className="text-sm font-bold text-emerald-600 tabular-nums">
            +${saving.toLocaleString()}
          </span>
          <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-600/50">Mensual</span>
        </div>
      </div>

      {/* Tip */}
      <div className="bg-emerald-500/[0.02] border border-emerald-500/5 rounded-xl p-4 flex items-start gap-3">
        <Lightbulb className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">
          {tip}
        </p>
      </div>

      {/* Potential annual */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-emerald-500/30" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">Potencial anual</span>
        </div>
        <span className="text-sm font-bold text-emerald-600/80 tabular-nums">
          ${(saving * 12).toLocaleString()}
        </span>
      </div>

    </div>
  )
}