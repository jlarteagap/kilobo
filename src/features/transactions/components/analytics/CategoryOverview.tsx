import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { CategoryData } from "@/types/transaction"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"

interface CategoryOverviewProps {
  data: CategoryData[]
}

const COLORS = [
  "#0ea5e9", "#22c55e", "#eab308", "#f97316",
  "#ef4444", "#8b5cf6", "#ec4899", "#6366f1",
]

const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
}

export function CategoryOverview({ data }: CategoryOverviewProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center h-[400px]">
        <p className="text-gray-400">No hay datos suficientes para mostrar</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribución de Gastos</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value, "BOB")}
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ paddingLeft: "20px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}