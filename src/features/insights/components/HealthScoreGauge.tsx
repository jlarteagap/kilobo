// features/insights/components/HealthScoreGauge.tsx

'use client'

import { INSIGHT_TOKENS } from '@/features/insights/chart-tokens'

interface Props {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  breakdown: {
    savings_rate      : number
    expense_stability : number
    budget_adherence  : number
  }
}

// Sin arcoíris de cinco colores: un solo acento (emerald) sobre neutros zinc.
// A y B usan el acento; C–F son neutros oscuros. El grado siempre va escrito,
// así que el color nunca es el único portador de significado.
const GRADE_CONFIG = {
  A: { label: 'Excelente',  accent: true  },
  B: { label: 'Bueno',       accent: true  },
  C: { label: 'Regular',     accent: false },
  D: { label: 'Deficiente',  accent: false },
  F: { label: 'Crítico',     accent: false },
} as const

export function HealthScoreGauge({ score, grade, breakdown }: Props) {
  const config      = GRADE_CONFIG[grade]
  const radius      = 54
  const stroke      = 4
  const normalised  = radius - stroke / 2
  const circumference = 2 * Math.PI * normalised
  const offset      = circumference - (score / 100) * circumference

  const arcColor = config.accent ? INSIGHT_TOKENS.accent : INSIGHT_TOKENS.spend
  const textColor = config.accent ? INSIGHT_TOKENS.accent : INSIGHT_TOKENS.text

  const bars = [
    { label: 'Tasa de ahorro', value: breakdown.savings_rate,     hint: 'Capacidad de reserva'   },
    { label: 'Estabilidad',    value: breakdown.expense_stability, hint: 'Consistencia de gasto' },
    { label: 'Control',        value: breakdown.budget_adherence,  hint: 'Apego a presupuesto'   },
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
            className="text-zinc-100"
          />
          <circle
            cx={80} cy={80} r={normalised}
            fill="none" stroke={arcColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.2, 0, 0, 1)' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center leading-none gap-2">
          <span className="text-5xl font-semibold tracking-tight tabular-nums" style={{ color: textColor }}>
            {score}
          </span>
          <span
            className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md"
            style={{
              backgroundColor: config.accent ? `${INSIGHT_TOKENS.accent}14` : INSIGHT_TOKENS.surface,
              color          : textColor,
            }}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex-1 w-full space-y-6">
        {bars.map(({ label, value, hint }) => (
          <div key={label} className="space-y-2">
            <div className="flex items-end justify-between px-0.5">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-zinc-600">{label}</span>
                <p className="text-[11px] text-zinc-400">{hint}</p>
              </div>
              <span className="text-sm font-semibold text-zinc-900 tabular-nums">{value}%</span>
            </div>
            <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width          : `${Math.min(value, 100)}%`,
                  backgroundColor: arcColor,
                }}
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}