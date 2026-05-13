// features/insights/components/TrendChart.tsx

'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { CategoryTrend }  from '@/lib/insights/algorithms'
import { useMemo }        from 'react'

interface Props {
  trends     : CategoryTrend[]
  maxLines?  : number
  annotation?: string
}

interface ChartPoint {
  month : string
  [key: string]: string | number
}

// Paleta de colores para líneas sin color de categoría
const FALLBACK_COLORS = [
  '#8b5cf6', '#06b6d4', '#f59e0b',
  '#ec4899', '#10b981', '#f97316',
]

export function TrendChart({ trends, maxLines = 4, annotation }: Props) {
  const topTrends = trends.slice(0, maxLines)

  // Transformar de { category, monthly[] } → [{ month, cat1, cat2 }]
  const chartData = useMemo<ChartPoint[]>(() => {
    if (!topTrends.length) return []

    const months = topTrends[0].monthly.map(m => m.month)

    return months.map(month => {
      const point: ChartPoint = {
        month: month.slice(0, 7), // 'YYYY-MM'
      }
      topTrends.forEach(trend => {
        const entry = trend.monthly.find(m => m.month === month)
        point[trend.category_name] = entry?.amount ?? 0
      })
      return point
    })
  }, [topTrends])

  const formatMonth = (value: string) => {
    const [year, month] = value.split('-')
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${months[parseInt(month) - 1]} ${year.slice(2)}`
  }

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('es', { maximumFractionDigits: 0 })}`

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Sin datos suficientes para mostrar tendencias
      </div>
    )
  }

  return (
    <>
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>

        <CartesianGrid
          vertical={false}
          stroke="hsl(var(--muted))"
          strokeOpacity={0.2}
        />

        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          dy={10}
        />

        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          width={70}
        />

        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
          labelFormatter={formatMonth}
          cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1 }}
          contentStyle={{
            backgroundColor : 'hsl(var(--card))',
            border          : '1px solid hsl(var(--border))',
            borderRadius    : '16px',
            fontSize        : '11px',
            boxShadow       : '0 8px 32px rgba(0,0,0,0.04)',
            padding         : '12px',
          }}
          labelStyle={{ fontWeight: 700, marginBottom: '8px', color: 'hsl(var(--foreground))' }}
        />

        <Legend
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ fontSize: '10px', paddingTop: '24px', fontWeight: 600, opacity: 0.6 }}
        />

        {topTrends.map((trend, i) => (
          <Line
            key={trend.category_id}
            type="monotone"
            dataKey={trend.category_name}
            stroke={trend.category_color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        ))}

      </LineChart>
    </ResponsiveContainer>

    {annotation && (
      <p className="text-xs text-muted-foreground/70 leading-relaxed mt-4 px-1 italic border-l-2 border-violet-500/30 pl-3">
        {annotation}
      </p>
    )}
    </>
  )
}