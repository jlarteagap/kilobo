// features/transactions/components/analytics/CategoryOverview.tsx
"use client"

import { useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { CategoryData } from "@/types/transaction"
import { ChartTooltipContainer } from "@/components/ui/chart-tooltip"
import type { Transaction }  from "@/types/transaction"
import type { Project }      from "@/types/project"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import {
  buildProjectSlices,
  buildMixedSlices,
  buildDetailSlices,
  type SliceItem,
} from "@/features/transactions/utils/category-overview.utils"

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: SliceItem }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item: SliceItem = payload[0].payload
  return (
    <ChartTooltipContainer active={active} payload={payload}>
      <div className="flex items-center gap-1.5">
        {item.icon && <span style={{ fontSize: 13 }}>{item.icon}</span>}
        <p className="font-medium text-gray-700">{item.name}</p>
      </div>
      <p className="text-gray-500 text-[12px]">{formatCurrency(item.value, 'BOB')}</p>
    </ChartTooltipContainer>
  )
}

// ─── Leyenda ─────────────────────────────────────────────────────────────────
function CustomLegend({ items }: { items: SliceItem[] }) {
  const total = items.reduce((s, i) => s + i.value, 0)

  return (
    <div className="flex flex-col gap-1.5 mt-4">
      {items.map((item) => {
        const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0'
        return (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[12px] text-gray-600 truncate flex-1 min-w-0">
              {item.icon && (
                <span className="mr-1" style={{ fontSize: 11 }}>{item.icon}</span>
              )}
              {item.name}
            </span>
            <span className="text-[11px] font-medium text-gray-400 flex-shrink-0">
              {pct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
interface CategoryOverviewProps {
  data:         CategoryData[]  // categorías personales — del hook existente
  transactions: Transaction[]   // transacciones filtradas por período
  projects:     Project[]       // proyectos activos
  projectId:    string | null   // filtro activo
}

export function CategoryOverview({
  data,
  transactions,
  projects,
  projectId,
}: CategoryOverviewProps) {
  const [selectedItem, setSelectedItem] = useState<{ id: string, name: string, color: string, isProject: boolean } | null>(null)

  const isProjectMode = !!projectId && projectId !== '__personal__'

  const projectSlices = buildProjectSlices(projects, transactions, projectId)

  const mixedSlices = buildMixedSlices(projects, data, transactions, projectId)

  const detailSlices = buildDetailSlices(selectedItem, transactions, isProjectMode)

  // ── Seleccionar modo ──────────────────────────────────────────────────────
  const items         = isProjectMode ? projectSlices : selectedItem ? detailSlices : mixedSlices
  const project       = isProjectMode ? projects.find((p) => p.id === projectId) : null

  // ── Empty state ───────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div
        className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center h-[400px] gap-2 shadow-card"
      >
        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xl">
          {isProjectMode ? (project?.icon ?? '📁') : '🥧'}
        </div>
        <p className="text-[13px] text-gray-400">
          {isProjectMode ? 'Sin gastos en este proyecto' : 'Sin datos de gastos'}
        </p>
        <p className="text-[11px] text-gray-300">
          {isProjectMode
            ? 'Registra gastos con subtipos para ver la distribución'
            : 'Registra gastos para ver la distribución'
          }
        </p>
      </div>
    )
  }

  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-card-hover"
    >
      {/* ── Header ── */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Distribución de gastos
        </h3>

        {isProjectMode && project ? (
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-[11px] text-gray-400">Subtipos ·</p>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                color:           project.color,
                backgroundColor: project.color + '18',
                border:          `0.5px solid ${project.color}30`,
              }}
            >
              {project.icon && <span className="mr-0.5">{project.icon}</span>}
              {project.name}
            </span>
          </div>
        ) : selectedItem ? (
          <div className="flex items-center gap-1.5 mt-1">
            <button 
              onClick={() => setSelectedItem(null)}
              className="text-[11px] font-medium text-gray-500 hover:text-gray-800 flex items-center transition-colors"
            >
              <span className="mr-1">←</span> Volver
            </button>
            <span className="text-[11px] text-gray-400">·</span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                color:           selectedItem.color,
                backgroundColor: selectedItem.color + '18',
                border:          `0.5px solid ${selectedItem.color}30`,
              }}
            >
              {selectedItem.name}
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 mt-0.5">
            {items.length} elemento{items.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Donut ── */}
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {items.map((item, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={item.color} 
                  cursor={!isProjectMode && !selectedItem && item.itemId ? "pointer" : "default"}
                  onClick={() => {
                    if (!isProjectMode && !selectedItem && item.itemId) {
                      setSelectedItem({ id: item.itemId, name: item.name, color: item.color, isProject: item.isProject })
                    }
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ── Leyenda ── */}
      <CustomLegend items={items} />
    </div>
  )
}