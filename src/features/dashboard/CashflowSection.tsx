// features/cashflow/CashflowSection.tsx
"use client"

import { useState } from "react"
import { ResponsiveContainer, Sankey, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

import { useTransactions } from "@/features/transactions/hooks/useTransactions"
import { useCategories }   from "@/features/categories/hooks/useCategories"
import { useAccounts }     from "@/features/accounts/hooks/useAccounts"
import { useProjects }     from "@/features/projects/hooks/useProjects"
import { SankeyCustomNode } from "./components/SankeyCustomNode"
import { useCashflowData } from "./hooks/useCashflowData"
import type { SankeyData } from "./hooks/useCashflowData"
import { PeriodSelector }  from "@/app/transactions/components/PeriodSelector"
import { formatCurrency }  from "@/features/accounts/utils/account-display.utils"
import { getPeriodLabel }  from "@/utils/date.utils"
import { DEFAULT_PERIOD }  from "@/types/period"
import type { Period }     from "@/types/period"

function CashflowSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="mb-4">
        <Skeleton className="h-4 w-36 rounded-full" />
        <Skeleton className="h-3 w-20 rounded-full mt-1.5" />
      </div>
      <Skeleton className="h-[280px] w-full rounded-xl" />
    </div>
  )
}

function CashflowEmpty({ period }: { period: Period }) {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-2 min-h-[300px]"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xl">
        💸
      </div>
      <p className="text-[13px] text-gray-400">
        Sin transacciones en {getPeriodLabel(period)}
      </p>
      <p className="text-[11px] text-gray-300">
        Registra ingresos y gastos para ver el flujo
      </p>
    </div>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      name:  string
      value: number
      payload?: {
        breakdown?: Record<string, number>
      }
      breakdown?: Record<string, number>
    }
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item?.name || !item?.value) return null

  // Recharts sometimes nests the custom node properties in payload.payload
  const breakdownData = item.payload?.breakdown || item.breakdown

  return (
    <div
      className="bg-white px-3 py-2 rounded-xl text-sm min-w-[140px]"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}
    >
      <p className="text-[12px] font-medium text-gray-600">{item.name}</p>
      <p className="text-[13px] font-semibold text-gray-900 mb-1">
        {formatCurrency(item.value, 'BOB')}
      </p>

      {breakdownData && Object.keys(breakdownData).length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1">
          {Object.entries(breakdownData)
            .sort((a, b) => b[1] - a[1])
            .map(([key, val]) => (
            <div key={key} className="flex justify-between items-center gap-4 text-[11px]">
              <span className="text-gray-500 truncate max-w-[120px]">{key}</span>
              <span className="text-gray-700 font-medium">{formatCurrency(val, 'BOB')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface CashflowSankeyProps {
  width?: number
  height?: number
  sankeyData: SankeyData
}

function CashflowSankey({ width = 0, height = 0, sankeyData }: CashflowSankeyProps) {
  
  // Ajustar márgenes según el ancho disponible
  const isSmall  = width < 400
  const isMedium = width < 600

  const marginRight = isSmall ? 70 : isMedium ? 100 : 130
  const marginLeft  = isSmall ? 70 : 100
  const nodePadding = isSmall ? 16 : 40
  const fontSize    = isSmall ? 8.5 : 11

  return (
    <Sankey
      width={width}
      height={height}
      data={sankeyData}
      nodeWidth={8}
      nodePadding={nodePadding}
      margin={{
        left:   marginLeft,
        right:  marginRight,
        top:    10,
        bottom: 20,
      }}
      link={{ stroke: '#e5e7eb', strokeOpacity: 0.6 }}
      node={
        <SankeyCustomNode
          containerWidth={width}
          fontSize={fontSize}
        />
      }
    >
      <Tooltip content={<CustomTooltip />} />
    </Sankey>
  )
}

export function CashflowSection() {
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD)

  const { data: transactions = [], isLoading: loadingTx  } = useTransactions()
  const { data: categories   = [], isLoading: loadingCat } = useCategories()
  const { data: accounts     = [], isLoading: loadingAcc } = useAccounts()
  const { data: projects = [] } = useProjects()


  const isLoading = loadingTx || loadingCat || loadingAcc

  const { sankeyData, isEmpty } = useCashflowData({
    transactions,
    categories,
    accounts,
    isLoading,
    period,
    projects,
  })

  if (isLoading) return <CashflowSkeleton />

  return (
    <div
      className="bg-card rounded-3xl p-6 border border-border/40"
      style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.02)' }}
    >
      {/* ── Header + PeriodSelector ── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
        <div className="w-full md:w-auto">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">Flujo de caja</h3>
          <p className="text-[11px] text-muted-foreground/60 mt-1 capitalize">
            {getPeriodLabel(period)}
          </p>
        </div>
        <div className="w-full md:w-auto overflow-hidden">
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* ── Contenido ── */}
      {isEmpty ? (
        <CashflowEmpty period={period} />
      ) : (
        <>
          <div className="overflow-x-auto no-scrollbar -mx-6 px-6">
            <div className="h-[400px] md:h-[500px] w-full min-w-[600px] md:min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <CashflowSankey sankeyData={sankeyData} />
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Leyenda ── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:gap-x-6 mt-6 pt-6 border-t border-border/40">
            {[
              { color: 'var(--growth)', label: 'Ingresos' },
              { color: 'var(--debt)',   label: 'Gastos'   },
              { color: 'var(--primary)', label: 'Cuentas'  },
              { color: 'var(--muted-foreground)', label: 'Balance' },
              { color: '#8B5CF6',  label: 'Proyectos' },  // ← NUEVO
              { color: '#F59E0B',  label: 'Subtipos'  },  // ← NUEVO
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}