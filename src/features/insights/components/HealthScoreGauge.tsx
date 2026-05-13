// features/insights/components/HealthScoreGauge.tsx

'use client'

import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'

interface Props {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  breakdown: {
    savings_rate      : number
    expense_stability : number
    budget_adherence  : number
  }
  aiExplanation?: {
    reason     : string
    main_factor: string
    detail     : string
  } | null
}

const GRADE_CONFIG = {
  A: { color: '#22c55e', label: 'Excelente',  bg: 'bg-green-500/10'  },
  B: { color: '#84cc16', label: 'Bueno',       bg: 'bg-lime-500/10'   },
  C: { color: '#eab308', label: 'Regular',     bg: 'bg-yellow-500/10' },
  D: { color: '#f97316', label: 'Deficiente',  bg: 'bg-orange-500/10' },
  F: { color: '#ef4444', label: 'Crítico',     bg: 'bg-red-500/10'    },
}

export function HealthScoreGauge({ score, grade, breakdown, aiExplanation }: Props) {
  const config      = GRADE_CONFIG[grade]
  const radius      = 54
  const stroke      = 4
  const normalised  = radius - stroke / 2
  const circumference = 2 * Math.PI * normalised
  const offset      = circumference - (score / 100) * circumference

  const bars = [
    { label: 'Tasa de ahorro',    value: breakdown.savings_rate,      hint: 'Capacidad de reserva'    },
    { label: 'Estabilidad',       value: breakdown.expense_stability,  hint: 'Consistencia de gasto'  },
    { label: 'Control',           value: breakdown.budget_adherence,   hint: 'Apego a presupuesto'    },
  ]

  return (
    <div className="flex flex-col sm:flex-row items-center gap-10 lg:gap-14">

      {/* Gauge SVG */}
      <div className="relative flex items-center justify-center shrink-0"
           style={{ width: 160, height: 160 }}>
        <svg width={160} height={160} className="-rotate-90">
          <circle
            cx={80} cy={80} r={normalised}
            fill="none" stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/10"
          />
          <circle
            cx={80} cy={80} r={normalised}
            fill="none"
            stroke={config.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.2, 0, 0, 1)' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center leading-none gap-2">
          <span className="text-5xl font-extrabold tracking-tight tabular-nums" style={{ color: config.color }}>
            {score}
          </span>
          <span
            className={cn('text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md', config.bg)}
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Breakdown + AI explanation */}
      <div className="flex-1 w-full space-y-6">
        {bars.map(({ label, value, hint }) => (
          <div key={label} className="space-y-2">
            <div className="flex items-end justify-between px-0.5">
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">{label}</span>
                <p className="text-[10px] text-muted-foreground/60">{hint}</p>
              </div>
              <span className="text-sm font-medium tabular-nums">{value}%</span>
            </div>
            <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width     : `${Math.min(value, 100)}%`,
                  backgroundColor: config.color,
                  opacity   : 0.6,
                }}
              />
            </div>
          </div>
        ))}

        {aiExplanation && (
          <div className="w-full pt-5 border-t border-muted/30 space-y-3">
            <div className="flex items-start gap-2 bg-violet-500/[0.03] rounded-xl p-4">
              <Info className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-foreground/70">{aiExplanation.reason}</p>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">{aiExplanation.detail}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-violet-500/60">
                    Factor principal: {aiExplanation.main_factor}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
