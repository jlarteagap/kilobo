
import { useState } from "react"
import {
  Area, AreaChart, Bar, BarChart, Line, LineChart,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts"
import { DataPoint } from "@/types/transaction"

interface IncomeExpenseChartProps {
    data: DataPoint[]
}

type ChartType = "area" | "bar" | "line"

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "area",  label: "Área" },
  { value: "bar",   label: "Barra" },
  { value: "line",  label: "Línea" },
]

const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
}

// Partes comunes extraídas — idénticas en los 3 chart types
const renderCommonAxes = () => [
  <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />,
  <XAxis
    key="xaxis"
    dataKey="label"
    axisLine={false}
    tickLine={false}
    tick={{ fill: "#6b7280", fontSize: 12 }}
    dy={10}
  />,
  <YAxis
    key="yaxis"
    axisLine={false}
    tickLine={false}
    tick={{ fill: "#6b7280", fontSize: 12 }}
    tickFormatter={(value) => `Bs${value}`}
  />,
  <Tooltip key="tooltip" contentStyle={TOOLTIP_STYLE} itemStyle={{ fontSize: "12px", fontWeight: 500 }} />,
  <Legend key="legend" wrapperStyle={{ paddingTop: "20px" }} />,
]

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const [chartType, setChartType] = useState<ChartType>("area")

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Ingresos vs Gastos</h3>

        <div className="flex bg-gray-100 rounded-lg p-1">
          {CHART_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setChartType(type.value)}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-md transition-all
                ${chartType === type.value
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
                }
              `}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data}>
              {renderCommonAxes()}
              <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={data}>
              {renderCommonAxes()}
              <Line type="monotone" dataKey="income" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="expense" name="Gastos" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: "#ef4444" }} activeDot={{ r: 5 }} />
            </LineChart>
          ) : (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              {renderCommonAxes()}
              <Area type="monotone" dataKey="income" name="Ingresos" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expense" name="Gastos" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}