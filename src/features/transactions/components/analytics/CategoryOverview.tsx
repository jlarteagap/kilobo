// features/transactions/components/analytics/CategoryOverview.tsx
"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import type { CategoryData } from "@/types/transaction"
import type { Transaction }  from "@/types/transaction"
import type { Project }      from "@/types/project"

// ─── Paleta para categorías personales ───────────────────────────────────────
const CATEGORY_COLORS = [
  '#B3D9FF', '#B3F0D9', '#FFD9B3', '#D9B3FF',
  '#FFB3B3', '#FFFAB3', '#B3FFD9', '#E0E0E0',
]

// ─── Tipos internos ───────────────────────────────────────────────────────────
interface SliceItem {
  name:       string
  value:      number
  color:      string
  icon?:      string
  isProject:  boolean
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item: SliceItem = payload[0].payload
  return (
    <div
      className="bg-white px-3 py-2 rounded-xl text-sm"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        {item.icon && <span style={{ fontSize: 13 }}>{item.icon}</span>}
        <p className="font-medium text-gray-700">{item.name}</p>
      </div>
      <p className="text-gray-500 text-[12px]">{formatCurrency(item.value, 'BOB')}</p>
    </div>
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

  // ── Modo proyecto activo: subtipos del proyecto seleccionado ─────────────
  const projectSlices = useMemo((): SliceItem[] => {
    if (!projectId || projectId === '__personal__') return []

    const project = projects.find((p) => p.id === projectId)
    const color   = project?.color ?? '#6b7280'

    const expenses = transactions.filter(
      (t) => t.type === 'EXPENSE' && t.project_id === projectId
    )
    if (expenses.length === 0) return []

    const bySubtype = new Map<string, number>()
    expenses.forEach((t) => {
      const key = t.subtype ?? 'Sin subtipo'
      bySubtype.set(key, (bySubtype.get(key) ?? 0) + t.amount)
    })

    // Generar tonos del color del proyecto para cada subtipo
    const entries = Array.from(bySubtype.entries()).sort((a, b) => b[1] - a[1])
    return entries.map(([name, value], i) => ({
      name,
      value,
      // Variaciones de opacidad del color del proyecto
      color:     i === 0 ? color : color + Math.floor(255 * (1 - i * 0.15)).toString(16).padStart(2, '0'),
      isProject: true,
    }))
  }, [transactions, projectId, projects])

  // ── Modo sin filtro: categorías personales + una slice por proyecto ───────
  const mixedSlices = useMemo((): SliceItem[] => {
    if (projectId && projectId !== '__personal__') return []

    const result: SliceItem[] = []

    // 1. Categorías personales (transacciones sin project_id)
    const personalExpenses = transactions.filter(
      (t) => t.type === 'EXPENSE' && !t.project_id
    )
    const totalPersonal = personalExpenses.reduce((s, t) => s + t.amount, 0)

    // Usar data del hook (ya viene calculada y con nombres de categoría)
    data.forEach((cat, i) => {
      if (cat.value > 0) {
        result.push({
          name:      cat.name,
          value:     cat.value,
          color:     CATEGORY_COLORS[i % CATEGORY_COLORS.length],
          isProject: false,
        })
      }
    })

    // 2. Una slice por proyecto — suma de todos sus gastos
    projects.forEach((project) => {
      const total = transactions
        .filter((t) => t.type === 'EXPENSE' && t.project_id === project.id)
        .reduce((s, t) => s + t.amount, 0)

      if (total > 0) {
        result.push({
          name:      project.name,
          value:     total,
          color:     project.color,
          icon:      project.icon ?? undefined,
          isProject: true,
        })
      }
    })

    // Ordenar por valor descendente
    return result.sort((a, b) => b.value - a.value)
  }, [transactions, projects, data, projectId])

  // ── Seleccionar modo ──────────────────────────────────────────────────────
  const isProjectMode = !!projectId && projectId !== '__personal__'
  const items         = isProjectMode ? projectSlices : mixedSlices
  const project       = isProjectMode ? projects.find((p) => p.id === projectId) : null

  // ── Empty state ───────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div
        className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center h-[400px] gap-2"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
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
      className="bg-white rounded-2xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
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
                <Cell key={`cell-${index}`} fill={item.color} />
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