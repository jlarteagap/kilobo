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
  trends   : CategoryTrend[]
  maxLines?: number   // cuántas categorías mostrar (top N)
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

export function TrendChart({ trends, maxLines = 4 }: Props) {
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
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.5}
        />

        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          width={64}
        />

        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
          labelFormatter={formatMonth}
          contentStyle={{
            backgroundColor : 'hsl(var(--card))',
            border          : '1px solid hsl(var(--border))',
            borderRadius    : '12px',
            fontSize        : '12px',
            boxShadow       : '0 4px 24px rgba(0,0,0,0.08)',
          }}
          labelStyle={{ fontWeight: 600 }}
        />

        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
        />

        {topTrends.map((trend, i) => (
          <Line
            key={trend.category_id}
            type="monotone"
            dataKey={trend.category_name}
            stroke={trend.category_color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        ))}

      </LineChart>
    </ResponsiveContainer>
  )
}