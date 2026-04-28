// features/insights/components/HealthScoreGauge.tsx

'use client'

import { cn } from '@/lib/utils'

interface Props {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  breakdown: {
    savings_rate      : number
    expense_stability : number
    budget_adherence  : number
  }
}

const GRADE_CONFIG = {
  A: { color: '#22c55e', label: 'Excelente',  bg: 'bg-green-500/10'  },
  B: { color: '#84cc16', label: 'Bueno',       bg: 'bg-lime-500/10'   },
  C: { color: '#eab308', label: 'Regular',     bg: 'bg-yellow-500/10' },
  D: { color: '#f97316', label: 'Deficiente',  bg: 'bg-orange-500/10' },
  F: { color: '#ef4444', label: 'Crítico',     bg: 'bg-red-500/10'    },
}

export function HealthScoreGauge({ score, grade, breakdown }: Props) {
  const config      = GRADE_CONFIG[grade]
  const radius      = 52
  const stroke      = 8
  const normalised  = radius - stroke / 2
  const circumference = 2 * Math.PI * normalised
  const offset      = circumference - (score / 100) * circumference

  const bars = [
    { label: 'Tasa de ahorro',    value: breakdown.savings_rate,      hint: 'Porcentaje de ingresos que no se gastan'    },
    { label: 'Estabilidad',       value: breakdown.expense_stability,  hint: 'Qué tan consistentes son tus gastos'        },
    { label: 'Control de gastos', value: breakdown.budget_adherence,   hint: 'Ausencia de anomalías y sobrecostos'        },
  ]

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">

      {/* Gauge SVG */}
      <div className="relative flex items-center justify-center shrink-0"
           style={{ width: 140, height: 140 }}>
        <svg width={140} height={140} className="-rotate-90">
          <circle
            cx={70} cy={70} r={normalised}
            fill="none" stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/20"
          />
          <circle
            cx={70} cy={70} r={normalised}
            fill="none"
            stroke={config.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center leading-none gap-1">
          <span className="text-4xl font-bold tabular-nums" style={{ color: config.color }}>
            {score}
          </span>
          <span
            className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', config.bg)}
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="flex-1 w-full space-y-4">
        {bars.map(({ label, value, hint }) => (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">{label}</span>
                <p className="text-[11px] text-muted-foreground">{hint}</p>
              </div>
              <span className="text-sm font-bold tabular-nums">{value}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width     : `${Math.min(value, 100)}%`,
                  backgroundColor: config.color,
                  opacity   : 0.8,
                }}
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}