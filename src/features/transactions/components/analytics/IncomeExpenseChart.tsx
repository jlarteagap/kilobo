// features/transactions/components/analytics/IncomeExpenseChart.tsx
import { useState } from "react"
import {
  Area, AreaChart, Bar, BarChart, Line, LineChart,
  CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import type { DataPoint } from "@/types/transaction"

type ChartType = 'area' | 'bar' | 'line'

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'area', label: 'Área'   },
  { value: 'bar',  label: 'Barra'  },
  { value: 'line', label: 'Línea'  },
]

// ─── Colores consistentes con el proyecto ─────────────────────────────────────
const INCOME_COLOR  = '#34d399'  // emerald-400
const EXPENSE_COLOR = '#fb7185'  // rose-400

// ─── Tooltip personalizado ────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="bg-white px-3 py-2.5 rounded-xl text-sm min-w-[140px]"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}
    >
      <p className="text-[11px] font-semibold text-gray-400 mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[12px] text-gray-500">{entry.name}</span>
          </div>
          <span className="text-[12px] font-semibold text-gray-700">
            {formatCurrency(entry.value, 'BOB')}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Ejes comunes ─────────────────────────────────────────────────────────────
function CommonAxes() {
  return (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
      <XAxis
        dataKey="label"
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#9ca3af', fontSize: 11 }}
        dy={8}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#9ca3af', fontSize: 11 }}
        tickFormatter={(v) => `Bs${v}`}
        width={48}
      />
      <Tooltip content={<CustomTooltip />} />
    </>
  )
}

// ─── Leyenda manual ───────────────────────────────────────────────────────────
function ChartLegend() {
  return (
    <div className="flex items-center gap-4 mt-3">
      {[
        { color: INCOME_COLOR,  label: 'Ingresos' },
        { color: EXPENSE_COLOR, label: 'Gastos'   },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[12px] text-gray-400">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyChart() {
  return (
    <div className="h-[280px] flex flex-col items-center justify-center gap-2">
      <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xl">
        📈
      </div>
      <p className="text-[13px] text-gray-400">Sin datos para el período</p>
      <p className="text-[11px] text-gray-300">Registra transacciones para ver la gráfica</p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
interface IncomeExpenseChartProps {
  data: DataPoint[]
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area')

  const hasData = data.some((d) => d.income > 0 || d.expense > 0)

  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Ingresos vs Gastos</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Evolución del período</p>
        </div>

        {/* Selector de tipo de gráfica */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {CHART_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setChartType(type.value)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-200',
                chartType === type.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart ── */}
      {!hasData ? (
        <EmptyChart />
      ) : (
        <>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={data} barCategoryGap="30%">
                  <CommonAxes />
                  <Bar dataKey="income"  name="Ingresos" fill={INCOME_COLOR}  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Gastos"   fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={data}>
                  <CommonAxes />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Ingresos"
                    stroke={INCOME_COLOR}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    name="Gastos"
                    stroke={EXPENSE_COLOR}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              ) : (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={INCOME_COLOR}  stopOpacity={0.15} />
                      <stop offset="100%" stopColor={INCOME_COLOR}  stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={EXPENSE_COLOR} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CommonAxes />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Ingresos"
                    stroke={INCOME_COLOR}
                    strokeWidth={2}
                    fill="url(#gradIncome)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Gastos"
                    stroke={EXPENSE_COLOR}
                    strokeWidth={2}
                    fill="url(#gradExpense)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          <ChartLegend />
        </>
      )}
    </div>
  )
}