"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ResponsiveContainer, Sankey, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

import { useTransactions } from "@/features/transactions/hooks/useTransactions"
import { useCategories }   from "@/features/categories/hooks/useCategories"
import { useActiveAccounts }     from "@/features/accounts/hooks/useAccounts"
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
    <div className="bg-white rounded-[22px] border border-zinc-200 p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-lg bg-zinc-100" />
          <Skeleton className="h-3 w-24 rounded-lg bg-zinc-100" />
        </div>
        <Skeleton className="h-9 w-44 rounded-xl bg-zinc-100" />
      </div>
      <Skeleton className="h-[360px] w-full rounded-xl bg-zinc-100" />
      <div className="flex gap-4 mt-5 pt-5 border-t border-zinc-100">
        <Skeleton className="h-3 w-20 rounded-full bg-zinc-100" />
        <Skeleton className="h-3 w-20 rounded-full bg-zinc-100" />
        <Skeleton className="h-3 w-20 rounded-full bg-zinc-100" />
      </div>
    </div>
  )
}

function CashflowEmpty({ period }: { period: Period }) {
  return (
    <div className="bg-white rounded-[22px] border border-zinc-200 p-10 flex flex-col items-center justify-center gap-3 min-h-[360px]">
      <div className="size-11 rounded-xl bg-zinc-100 flex items-center justify-center">
        <div className="size-2.5 rounded-full bg-zinc-300" />
      </div>
      <p className="text-sm font-medium text-zinc-900 tracking-tight">
        Sin movimientos en {getPeriodLabel(period)}
      </p>
      <p className="text-xs text-zinc-500 max-w-[28ch] text-center leading-relaxed">
        Registra ingresos y gastos para visualizar el flujo entre cuentas y categorías.
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
      <p className="text-xs font-semibold text-zinc-900 tracking-tight">{item.name}</p>
      <p className="text-sm font-bold text-zinc-900 tabular-nums mt-0.5">
        {formatCurrency(item.value, 'BOB')}
      </p>

      {breakdownData && Object.keys(breakdownData).length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-col gap-1.5">
          {Object.entries(breakdownData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([key, val]) => (
            <div key={key} className="flex justify-between items-center gap-6 text-xs">
              <span className="text-zinc-500 truncate max-w-[140px]">{key}</span>
              <span className="text-zinc-900 font-medium tabular-nums">{formatCurrency(val, 'BOB')}</span>
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

  const isSmall  = width < 420
  const nodePadding = isSmall ? 18 : 28
  const fontSize    = isSmall ? 11 : 12

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
          nodeWidth={10}
          nodePadding={nodePadding}
          margin={{
            left:   isSmall ? 16 : 24,
            right:  isSmall ? 16 : 24,
            top:    12,
            bottom: 16,
          }}
          link={<SankeyCustomLink />}
          node={
            <SankeyCustomNode
              containerWidth={width}
              fontSize={fontSize}
            />
          }
        >
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
        </Sankey>
      </div>
    </SankeySelectionProvider>
  )
}

export function CashflowSection() {
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD)

  const { data: transactions = [], isLoading: loadingTx  } = useTransactions()
  const { data: categories   = [], isLoading: loadingCat } = useCategories()
  const { data: accounts     = [], isLoading: loadingAcc } = useActiveAccounts()
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

  const metrics = useMemo(() => {
    let income = 0
    let expense = 0
    sankeyData.links.forEach((l) => {
      const src = sankeyData.nodes[l.source]
      const tgt = sankeyData.nodes[l.target]
      if (src?.type === 'income' || tgt?.type === 'account') {
        // heuristic: income links originate from income type
        if (src?.type === 'income') income += l.value
      }
      if (tgt?.type === 'expense' || tgt?.type === 'subtype') expense += l.value
    })
    // Fallback: sum by type if above misses
    if (income === 0 && expense === 0) {
      sankeyData.nodes.forEach((n, i) => {
        const out = sankeyData.links.filter(l => l.source === i).reduce((s,l)=>s+l.value,0)
        if (n.type === 'income') income += out
        if (n.type === 'expense') expense += sankeyData.links.filter(l=>l.target===i).reduce((s,l)=>s+l.value,0)
      })
    }
    return { income, expense, balance: income - expense }
  }, [sankeyData])

  if (isLoading) return <CashflowSkeleton />

  return (
    <div className="bg-white rounded-[22px] border border-zinc-200 p-6 md:p-7">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 md:gap-6 mb-6">
        <div>
          <h3 className="text-[13px] font-semibold text-zinc-900 tracking-tight">Flujo de caja</h3>
          <p className="text-xs text-zinc-500 mt-1 capitalize">
            {getPeriodLabel(period)}
          </p>
        </div>
        <div className="w-full lg:w-auto">
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {isEmpty ? (
        <CashflowEmpty period={period} />
      ) : (
        <>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-2 md:p-3 overflow-hidden">
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <CashflowSankey sankeyData={sankeyData} />
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 pt-5 border-t border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-600" />
              <span className="text-xs font-medium text-zinc-600">Ingresos</span>
              <span className="text-xs font-semibold text-zinc-900 tabular-nums">{formatCurrency(metrics.income, 'BOB')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-zinc-800" />
              <span className="text-xs font-medium text-zinc-600">Gastos</span>
              <span className="text-xs font-semibold text-zinc-900 tabular-nums">{formatCurrency(metrics.expense, 'BOB')}</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs">
              <span className="text-zinc-500">Balance</span>
              <span className={`font-semibold tabular-nums ${metrics.balance >= 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
                {formatCurrency(metrics.balance, 'BOB')}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
            Toca un nodo para aislar su flujo. El grosor representa el monto en bolivianos.
          </p>
        </>
      )}
    </div>
  )
}
