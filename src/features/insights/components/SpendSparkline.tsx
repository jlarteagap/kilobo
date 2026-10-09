// features/insights/components/SpendSparkline.tsx

'use client'

import { MonthlySpend } from '@/lib/insights/algorithms'
import { INSIGHT_TOKENS } from '@/features/insights/chart-tokens'

interface Props {
  monthly  : MonthlySpend[]
  width?   : number
  height?  : number
}

const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  return `${MONTH_SHORT[parseInt(month, 10) - 1]} ${year.slice(2)}`
}

const money = (n: number) =>
  new Intl.NumberFormat('es', { maximumFractionDigits: 0 }).format(n)

/**
 * Micro-serie de N meses. El último punto (mes en curso) va hueco y con trazo
 * punteado: se lee como proyección, no como dato cerrado.
 * Los meses cerrados van en línea continua zinc-300.
 */
export function SpendSparkline({ monthly, width = 76, height = 24 }: Props) {
  if (monthly.length === 0) return null

  const pad = 3
  const max = Math.max(...monthly.map(m => m.amount), 1)
  const step = monthly.length > 1 ? (width - pad * 2) / (monthly.length - 1) : 0

  const pointAt = (amount: number, i: number) => ({
    x: pad + step * i,
    y: height - pad - (amount / max) * (height - pad * 2),
  })

  // Los meses cerrados como polilínea continua
  const closed = monthly.filter(m => !m.is_projected)
  const projected = monthly.find(m => m.is_projected)

  // La incertidumbre viaja en el aria-label: el número es correcto, lo que
  // cambia es cuánto conviene confiar en él según cuántas transacciones lo sostienen.
  const history = monthly
    .map(m => `${monthLabel(m.month)}: $${money(m.amount)}`)
    .join(', ')

  const confidenceNote = projected?.projected_cv != null && projected.projected_cv > 0
    ? ` Mes en curso proyectado a mes completo, incertidumbre estimada ±${projected.projected_cv}%`
    : ''

  const closedOffset = monthly.length - (projected ? 1 : 0)
  const closedPath = closed
    .map((m, i) => {
      const { x, y } = pointAt(m.amount, i)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  // El tramo proyectado une el último mes cerrado con el punto abierto
  let projectedPath = ''
  if (projected && closed.length > 0) {
    const from = pointAt(closed[closed.length - 1].amount, closed.length - 1)
    const to   = pointAt(projected.amount, closed.length)
    projectedPath = `M${from.x.toFixed(1)},${from.y.toFixed(1)} L${to.x.toFixed(1)},${to.y.toFixed(1)}`
  }

  const label = `${history}.${confidenceNote}`

  // Halo de incertidumbre alrededor del punto proyectado. Solo aparece cuando
  // el estimado se apoya en pocas transacciones (±30% o más) — el número es
  // correcto en todos los casos, lo que se señala es cuánto confiar en él.
  const cv = projected?.projected_cv ?? 0
  const showUncertainty = projected != null && cv >= 30
  const projPoint = projected ? pointAt(projected.amount, closedOffset) : null

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className="overflow-visible"
    >
      {showUncertainty && projPoint && (
        <circle
          cx={projPoint.x}
          cy={projPoint.y}
          r={5.5}
          fill="none"
          stroke={INSIGHT_TOKENS.seriesProjected}
          strokeWidth={1}
          strokeDasharray="1.5 1.5"
          opacity={0.5}
        />
      )}

      {closedPath && (
        <path
          d={closedPath}
          fill="none"
          stroke={INSIGHT_TOKENS.seriesPast}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {projectedPath && (
        <path
          d={projectedPath}
          fill="none"
          stroke={INSIGHT_TOKENS.seriesProjected}
          strokeWidth={1.5}
          strokeDasharray="2 2"
          strokeLinecap="round"
        />
      )}

      {projected && (
        <circle
          cx={pointAt(projected.amount, closedOffset).x}
          cy={pointAt(projected.amount, closedOffset).y}
          r={2.25}
          fill="#FFFFFF"
          stroke={INSIGHT_TOKENS.seriesProjected}
          strokeWidth={1.5}
        />
      )}
    </svg>
  )
}