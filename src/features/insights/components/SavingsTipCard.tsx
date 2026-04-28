// features/insights/components/SavingsTipCard.tsx

'use client'

import { SavingOpportunity }   from '@/lib/insights/algorithms'
import { AIInsights }          from '@/lib/insights/ai-narrator'
import { Lightbulb, TrendingDown } from 'lucide-react'
import { cn }                  from '@/lib/utils'

interface Props {
  opportunity : SavingOpportunity
  aiTip?      : AIInsights['saving_tips'][number]
  rank        : number
}

export function SavingsTipCard({ opportunity, aiTip, rank }: Props) {
  const saving = aiTip?.estimated_monthly_saving ?? opportunity.potential_saving
  const tip    = aiTip?.tip ?? opportunity.insight

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3
                    hover:border-emerald-500/40 transition-colors duration-200">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-600 bg-emerald-500/15
                           w-5 h-5 rounded-full flex items-center justify-center">
            {rank}
          </span>
          {opportunity.category_color && (
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: opportunity.category_color }}
            />
          )}
          <span className="text-sm font-semibold">{opportunity.category_name}</span>
        </div>

        <div className="flex items-center gap-1 text-emerald-600 shrink-0">
          <TrendingDown className="h-3.5 w-3.5" />
          <span className="text-xs font-bold">
            ~${saving.toLocaleString()}/mes
          </span>
        </div>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-2">
        <Lightbulb className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
      </div>

      {/* Potential annual */}
      <div className="flex items-center justify-between pt-1 border-t border-emerald-500/15">
        <span className="text-[10px] text-muted-foreground">Ahorro anual estimado</span>
        <span className="text-xs font-bold text-emerald-600">
          ~${(saving * 12).toLocaleString()}
        </span>
      </div>

    </div>
  )
}