// features/cashflow/CashflowSection.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { ResponsiveContainer, Sankey, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

import { useTransactions } from "@/features/transactions/hooks/useTransactions"
import { useCategories }   from "@/features/categories/hooks/useCategories"
import { useAccounts }     from "@/features/accounts/hooks/useAccounts"
import { useProjects }     from "@/features/projects/hooks/useProjects"
import { SankeyCustomNode } from "./components/SankeyCustomNode"
import { SankeyCustomLink } from "./components/SankeyCustomLink"
import { SankeySelectionProvider } from "./components/SankeySelectionContext"
import { useCashflowData } from "./hooks/useCashflowData"
import type { SankeyData } from "./hooks/useCashflowData"
import { PeriodSelector }  from "@/app/transactions/components/PeriodSelector"
import { formatCurrency }  from "@/features/accounts/utils/account-display.utils"
import { ChartTooltipContainer } from "@/components/ui/chart-tooltip"
import { getPeriodLabel }  from "@/utils/date.utils"
import { DEFAULT_PERIOD }  from "@/types/period"
import type { Period }     from "@/types/period"

function CashflowSkeleton() {
  return (
    <div className="bg-white rounded-[22px] p-6"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
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
    <div className="bg-white rounded-[22px] p-6 flex flex-col items-center justify-center gap-2 min-h-[300px]"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      <div className="w-10 h-10 rounded-2xl bg-[#F2F9E3] flex items-center justify-center text-xl">
        💸
      </div>
      <p className="text-[13px] text-[#6E6E73]">
        Sin transacciones en {getPeriodLabel(period)}
      </p>
      <p className="text-[11px] text-[#6E6E73]/60">
        Registra ingresos y gastos para ver el flujo
      </p>
    </div>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name:  string
    value: number
    payload?: {
      payload?: {
        name?:       string
        value?:      number
        breakdown?:  Record<string, number>
      }
    }
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  if (!item?.name || typeof item.value !== 'number') return null

  const breakdownData = item.payload?.payload?.breakdown

  return (
    <ChartTooltipContainer active={active} payload={payload}>
      <p className="text-[12px] font-medium text-[#6E6E73]">{item.name}</p>
      <p className="text-[13px] font-semibold text-foreground mb-1">
        {formatCurrency(item.value, 'BOB')}
      </p>

      {breakdownData && Object.keys(breakdownData).length > 0 && (
        <div className="mt-2 pt-2 border-t border-[rgba(0,0,0,0.06)] flex flex-col gap-1">
          {Object.entries(breakdownData)
            .sort((a, b) => b[1] - a[1])
            .map(([key, val]) => (
            <div key={key} className="flex justify-between items-center gap-4 text-[11px]">
              <span className="text-[#6E6E73] truncate max-w-[120px]">{key}</span>
              <span className="text-foreground/80 font-medium">{formatCurrency(val, 'BOB')}</span>
            </div>
          ))}
        </div>
      )}
    </ChartTooltipContainer>
  )
}

interface CashflowSankeyProps {
  width?: number
  height?: number
  sankeyData: SankeyData
}

function CashflowSankey({ width = 0, height = 0, sankeyData }: CashflowSankeyProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  const isSmall  = width < 400
  const isMedium = width < 600

  const marginRight = isSmall ? 70 : isMedium ? 100 : 130
  const marginLeft  = isSmall ? 70 : 100
  const nodePadding = isSmall ? 16 : 40
  const fontSize    = isSmall ? 8.5 : 11

  useEffect(() => {
    if (selectedIdx === null) return
    const handler = (e: MouseEvent) => {
      if (!chartRef.current?.contains(e.target as Node)) return
      if (!(e.target as HTMLElement).closest('[data-sankey-node]')) {
        setSelectedIdx(null)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [selectedIdx])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIdx(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <SankeySelectionProvider
      sankeyData={sankeyData}
      selectedIdx={selectedIdx}
      onSelect={setSelectedIdx}
    >
      <div ref={chartRef}>
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
          link={<SankeyCustomLink />}
          node={
            <SankeyCustomNode
              containerWidth={width}
              fontSize={fontSize}
            />
          }
        >
          <Tooltip content={<CustomTooltip />} />
        </Sankey>
      </div>
    </SankeySelectionProvider>
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
    <div className="bg-white rounded-[22px] p-6"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      {/* ── Header + PeriodSelector ── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
        <div className="w-full md:w-auto">
          <h3 className="text-sm font-bold text-foreground tracking-[-0.01em]">Flujo de caja</h3>
          <p className="text-[11px] text-[#6E6E73] mt-1 capitalize">
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
            <div className="h-[350px] w-full min-w-[600px] md:min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <CashflowSankey sankeyData={sankeyData} />
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Leyenda ── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:gap-x-6 mt-5 pt-5 border-t border-[rgba(0,0,0,0.06)]">
            {[
              { color: '#4F6A35',  label: 'Ingresos'      },
              { color: '#B5543D',  label: 'Gastos'        },
              { color: '#ACC18A',  label: 'Cuentas'       },
              { color: '#837A75',  label: 'Balance'       },
              { color: '#7A9B57',  label: 'Actividades'   },
              { color: '#D9A487',  label: 'Etiquetas'     },
              { color: '#C8D9A9',  label: 'Transferencias' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-[0.04em]">
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