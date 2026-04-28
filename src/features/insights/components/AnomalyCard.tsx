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
  high  : { border: 'border-red-500/25',    bg: 'bg-red-500/5',    icon: 'text-red-500',    badge: 'bg-red-500/10 text-red-600'    },
  medium: { border: 'border-amber-500/25',  bg: 'bg-amber-500/5',  icon: 'text-amber-500',  badge: 'bg-amber-500/10 text-amber-600'  },
  low   : { border: 'border-blue-500/25',   bg: 'bg-blue-500/5',   icon: 'text-blue-500',   badge: 'bg-blue-500/10 text-blue-600'   },
}

export function AnomalyCard({ anomaly, aiExplanation }: Props) {
  const s       = SEVERITY[anomaly.severity]
  const isUp    = anomaly.delta_pct > 0
  const absDelta = Math.abs(anomaly.delta_pct)

  return (
    <div className={cn('rounded-2xl border p-4 space-y-3', s.border, s.bg)}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {anomaly.category_color && (
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: anomaly.category_color }}
            />
          )}
          <span className="text-sm font-semibold">{anomaly.category_name}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className={cn('text-xs gap-1', s.badge)}>
            {isUp
              ? <ArrowUpRight className="h-3 w-3" />
              : <ArrowDownRight className="h-3 w-3" />
            }
            {absDelta}%
          </Badge>
          <Badge variant="outline" className="text-[10px] capitalize">
            {anomaly.severity === 'high' ? 'Alta' : anomaly.severity === 'medium' ? 'Media' : 'Baja'}
          </Badge>
        </div>
      </div>

      {/* Amounts */}
      <div className="flex items-center gap-4 text-sm">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Este mes</p>
          <p className="font-bold">${anomaly.current_amount.toLocaleString()}</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Promedio</p>
          <p className="font-medium text-muted-foreground">${anomaly.average_amount.toLocaleString()}</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Diferencia</p>
          <p className={cn('font-bold', isUp ? 'text-red-500' : 'text-green-500')}>
            {isUp ? '+' : '-'}${Math.abs(anomaly.current_amount - anomaly.average_amount).toLocaleString()}
          </p>
        </div>
      </div>

      {/* AI Explanation */}
      {aiExplanation && (
        <div className="space-y-1.5 pt-1 border-t border-border/40">
          <p className="text-xs text-foreground/80">{aiExplanation.explanation}</p>
          <div className="flex items-start gap-1.5">
            <AlertTriangle className={cn('h-3 w-3 mt-0.5 shrink-0', s.icon)} />
            <p className="text-xs font-medium">{aiExplanation.action}</p>
          </div>
        </div>
      )}

    </div>
  )
}