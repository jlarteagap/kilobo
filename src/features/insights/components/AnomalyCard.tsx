// features/insights/components/AnomalyCard.tsx

'use client'

import { Anomaly }              from '@/lib/insights/algorithms'
import { AIInsights }           from '@/lib/insights/ai-narrator'
import { Badge }                from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react'
import { cn }                   from '@/lib/utils'

interface Props {
  anomaly    : Anomaly
  aiExplanation?: AIInsights['anomaly_explanations'][number]
}

const SEVERITY = {
  high  : { border: 'border-red-500/10',    bg: 'bg-red-500/[0.02]',    icon: 'text-red-500',    badge: 'bg-red-500/10 text-red-600',    label: 'Crítico' },
  medium: { border: 'border-amber-500/10',  bg: 'bg-amber-500/[0.02]',  icon: 'text-amber-500',  badge: 'bg-amber-500/10 text-amber-600',  label: 'Moderado' },
  low   : { border: 'border-blue-500/10',   bg: 'bg-blue-500/[0.02]',   icon: 'text-blue-500',   badge: 'bg-blue-500/10 text-blue-600',   label: 'Leve' },
}

export function AnomalyCard({ anomaly, aiExplanation }: Props) {
  const s       = SEVERITY[anomaly.severity]
  const isUp    = anomaly.delta_pct > 0
  const absDelta = Math.abs(anomaly.delta_pct)

  return (
    <div className={cn('rounded-2xl border p-6 transition-all duration-300 hover:shadow-sm space-y-5', s.border, s.bg)}>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {anomaly.category_color && (
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: anomaly.category_color }}
            />
          )}
          <span className="text-sm font-bold tracking-tight text-foreground/80">{anomaly.category_name}</span>
        </div>

        <Badge variant="outline" className={cn('text-[10px] uppercase tracking-widest font-bold px-2 py-0 h-5 border-transparent', s.badge)}>
          {s.label}
        </Badge>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">Real</p>
          <p className="text-sm font-bold tabular-nums">${anomaly.current_amount.toLocaleString()}</p>
        </div>
        <div className="space-y-1 border-x border-muted/20 px-2">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">Media</p>
          <p className="text-sm font-medium text-muted-foreground/70 tabular-nums">${anomaly.average_amount.toLocaleString()}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">Variación</p>
          <div className="flex items-center justify-end gap-1">
            <span className={cn('text-sm font-bold tabular-nums', isUp ? 'text-red-500' : 'text-emerald-500')}>
              {isUp ? '+' : '-'}{absDelta}%
            </span>
          </div>
        </div>
      </div>

      {/* AI Explanation */}
      {aiExplanation && (
        <div className="space-y-3 pt-4 border-t border-muted/40">
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            {aiExplanation.explanation}
          </p>
          <div className="flex items-start gap-2 bg-foreground/[0.02] rounded-lg p-3">
            <AlertTriangle className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', s.icon)} />
            <p className="text-xs font-bold leading-tight">{aiExplanation.action}</p>
          </div>
        </div>
      )}

    </div>
  )
}