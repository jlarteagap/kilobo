// features/cashflow/CashflowSection.tsx
"use client"

import { ResponsiveContainer, Sankey, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

import { useTransactions } from "@/features/transactions/hooks/useTransactions"
import { useCategories }   from "@/features/categories/hooks/useCategories"
import { useAccounts }     from "@/features/accounts/hooks/useAccounts"
import { useCashflowData } from "./hooks/useCashflowData"
import { SankeyCustomNode } from "./components/SankeyCustomNode"
import { formatCurrency }  from "@/features/accounts/utils/account-display.utils"

// ─── Skeleton ─────────────────────────────────────────────────────────────────
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

// ─── Empty state ──────────────────────────────────────────────────────────────
function CashflowEmpty() {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-2 min-h-[300px]"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xl">
        💸
      </div>
      <p className="text-[13px] text-gray-400">Sin transacciones este mes</p>
      <p className="text-[11px] text-gray-300">
        Registra ingresos y gastos para ver el flujo
      </p>
    </div>
  )
}

// ─── Tooltip personalizado ────────────────────────────────────────────────────
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null

  const { name, value } = payload[0]?.payload ?? {}
  if (!name || !value) return null

  return (
    <div
      className="bg-white px-3 py-2 rounded-xl text-sm"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}
    >
      <p className="text-[12px] font-medium text-gray-600">{name}</p>
      <p className="text-[13px] font-semibold text-gray-900">
        {formatCurrency(value, 'BOB')}
      </p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function CashflowSection() {
  const { data: transactions = [], isLoading: loadingTx  } = useTransactions()
  const { data: categories   = [], isLoading: loadingCat } = useCategories()
  const { data: accounts     = [], isLoading: loadingAcc } = useAccounts()

  const isLoading = loadingTx || loadingCat || loadingAcc

  const { sankeyData, isEmpty } = useCashflowData({
    transactions,
    categories,
    accounts,
    isLoading,
  })

  if (isLoading) return <CashflowSkeleton />
  if (isEmpty)   return <CashflowEmpty />

  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* ── Header ── */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-700">Flujo de caja</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">Mes actual</p>
      </div>

      {/* ── Sankey ── */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={sankeyData}
            nodeWidth={10}
            nodePadding={40}
            margin={{ left: 20, right: 130, top: 10, bottom: 10 }}
            link={{
              stroke:        '#e5e7eb',
              strokeOpacity: 0.6,
            }}
            node={<SankeyCustomNode />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Sankey>
        </ResponsiveContainer>
      </div>

      {/* ── Leyenda ── */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
        {[
          { color: '#34d399', label: 'Ingresos'  },
          { color: '#fb7185', label: 'Gastos'    },
          { color: '#60a5fa', label: 'Cuentas'   },
          { color: '#9ca3af', label: 'Balance'   },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[11px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}