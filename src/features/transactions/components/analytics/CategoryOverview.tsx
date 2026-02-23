// features/transactions/components/analytics/CategoryOverview.tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import type { CategoryData } from "@/types/transaction"

// ─── Paleta consistente con el proyecto ───────────────────────────────────────
const COLORS = [
  '#B3D9FF', // azul
  '#B3F0D9', // menta
  '#FFD9B3', // melocotón
  '#D9B3FF', // lavanda
  '#FFB3B3', // rosa
  '#FFFAB3', // amarillo
  '#B3FFD9', // verde
  '#E0E0E0', // gris
]

// ─── Tooltip personalizado ────────────────────────────────────────────────────
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null

  const { name, value } = payload[0].payload
  return (
    <div
      className="bg-white px-3 py-2 rounded-xl text-sm"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}
    >
      <p className="font-medium text-gray-700">{name}</p>
      <p className="text-gray-500 text-[12px]">{formatCurrency(value, 'BOB')}</p>
    </div>
  )
}

// ─── Leyenda personalizada ────────────────────────────────────────────────────
function CustomLegend({ data }: { data: CategoryData[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex flex-col gap-2 mt-4">
      {data.slice(0, 6).map((entry, index) => {
        const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0'
        return (
          <div key={entry.name} className="flex items-center gap-2">
            {/* Dot de color */}
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            {/* Nombre */}
            <span className="text-[12px] text-gray-600 truncate flex-1 min-w-0">
              {entry.name}
            </span>
            {/* Porcentaje */}
            <span className="text-[11px] font-medium text-gray-400 flex-shrink-0">
              {pct}%
            </span>
          </div>
        )
      })}
      {data.length > 6 && (
        <p className="text-[11px] text-gray-300 pl-4">
          +{data.length - 6} más
        </p>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
interface CategoryOverviewProps {
  data: CategoryData[]
}

export function CategoryOverview({ data }: CategoryOverviewProps) {
  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!data || data.length === 0) {
    return (
      <div
        className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center h-[400px] gap-2"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xl">
          🥧
        </div>
        <p className="text-[13px] text-gray-400">Sin datos de gastos</p>
        <p className="text-[11px] text-gray-300">Registra gastos para ver la distribución</p>
      </div>
    )
  }

  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Distribución de gastos</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">{data.length} categorías</p>
      </div>

      {/* Donut */}
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda */}
      <CustomLegend data={data} />
    </div>
  )
}