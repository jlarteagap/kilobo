// features/transactions/components/analytics/SparklineChart.tsx
import { ResponsiveContainer, AreaChart, Area } from "recharts"

interface SparklineChartProps {
  data:  { value: number }[]
  color: string
}

export function SparklineChart({ data, color }: SparklineChartProps) {
  // Si todos los valores son 0, no hay nada que mostrar
  const hasData = data.some((d) => d.value !== 0)

  if (!hasData) {
    return (
      <div
        className="w-full h-full"
        style={{ background: `linear-gradient(to top, ${color}08, transparent)` }}
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace('#', '')})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}