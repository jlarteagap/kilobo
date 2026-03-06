// features/accounts/components/AssetsTable.tsx
"use client"

import { useState } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AssetDetail } from "@/types/account"

type SortKey   = 'name' | 'category' | 'weight' | 'value'
type SortOrder = 'asc' | 'desc'

// ─── Helper: parsear valor numérico desde string formateado ───────────────────
function parseValue(formattedValue: string): number {
  return parseFloat(formattedValue.replace(/[^0-9.-]+/g, '')) || 0
}

function parseWeight(weight: string): number {
  return parseFloat(weight.replace('%', '')) || 0
}

// ─── Icono de ordenamiento ────────────────────────────────────────────────────
function SortIcon({ column, sortKey, sortOrder }: {
  column:    SortKey
  sortKey:   SortKey
  sortOrder: SortOrder
}) {
  if (column !== sortKey) return <ArrowUpDown className="w-3 h-3 text-gray-300" />
  return sortOrder === 'asc'
    ? <ArrowUp   className="w-3 h-3 text-gray-600" />
    : <ArrowDown className="w-3 h-3 text-gray-600" />
}

// ─── Header de columna ordenable ─────────────────────────────────────────────
function SortableHeader({
  label,
  column,
  sortKey,
  sortOrder,
  align = 'left',
  onSort,
}: {
  label:     string
  column:    SortKey
  sortKey:   SortKey
  sortOrder: SortOrder
  align?:    'left' | 'right'
  onSort:    (col: SortKey) => void
}) {
  return (
    <th className={cn(
      'px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider',
      align === 'right' && 'text-right'
    )}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex items-center gap-1 hover:text-gray-600 transition-colors duration-150',
          align === 'right' && 'ml-auto'
        )}
      >
        {label}
        <SortIcon column={column} sortKey={sortKey} sortOrder={sortOrder} />
      </button>
    </th>
  )
}

// ─── Fila de asset ────────────────────────────────────────────────────────────
function AssetRow({ asset }: { asset: AssetDetail }) {
  return (
    <tr className="hover:bg-gray-50/60 transition-colors duration-100">
      {/* Activo */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${asset.color}20` }}
          >
            <asset.icon className="w-4 h-4" style={{ color: asset.color }} />
          </div>
          <span className="font-medium text-gray-800 text-sm">{asset.name}</span>
        </div>
      </td>

      {/* Categoría */}
      <td className="px-5 py-3">
        <span className="text-[13px] text-gray-500">{asset.category}</span>
      </td>

      {/* Peso */}
      <td className="px-5 py-3">
        <Badge
          variant="secondary"
          className="text-[11px] rounded-full bg-gray-100 text-gray-500 hover:bg-gray-100"
        >
          {asset.weight}
        </Badge>
      </td>

      {/* Valor */}
      <td className="px-5 py-3 text-right">
        <span className="text-sm font-semibold text-gray-900">
          {asset.formattedValue}
        </span>
      </td>
    </tr>
  )
}

// ─── Sección separada (activos o pasivos) ─────────────────────────────────────
function AssetSection({
  title,
  assets,
  sortKey,
  sortOrder,
  onSort,
  totalLabel,
  totalValue,
  totalColor,
}: {
  title:      string
  assets:     AssetDetail[]
  sortKey:    SortKey
  sortOrder:  SortOrder
  onSort:     (col: SortKey) => void
  totalLabel: string
  totalValue: string
  totalColor: string
}) {
  if (assets.length === 0) return null

  return (
    <div>
      {/* Sub-header de sección */}
      <div className="px-5 py-2.5 bg-gray-50/60 border-y border-gray-50 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        <span className={cn('text-[12px] font-semibold', totalColor)}>
          {totalValue}
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-50">
            <SortableHeader label="Activo"    column="name"     sortKey={sortKey} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="Categoría" column="category" sortKey={sortKey} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="Peso"      column="weight"   sortKey={sortKey} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="Valor"     column="value"    sortKey={sortKey} sortOrder={sortOrder} onSort={onSort} align="right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {assets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
interface AssetsTableProps {
  assets: AssetDetail[]
  // Totales formateados — calculados fuera del componente
  totalAssetsFormatted:      string
  totalLiabilitiesFormatted: string
  netWorthFormatted:         string
  netWorthPositive:          boolean
}

export function AssetsTable({
  assets,
  totalAssetsFormatted,
  totalLiabilitiesFormatted,
  netWorthFormatted,
  netWorthPositive,
}: AssetsTableProps) {
  const [sortKey,   setSortKey  ] = useState<SortKey>('value')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (col: SortKey) => {
    if (sortKey === col) {
      setSortOrder((prev) => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(col)
      setSortOrder('desc')
    }
  }

  // ── Separar activos y pasivos ────────────────────────────────────────────────
  const activeAssets      = assets.filter((a) => a.category !== 'Deuda')
  const liabilityAssets   = assets.filter((a) => a.category === 'Deuda')

  // ── Ordenar ──────────────────────────────────────────────────────────────────
  const sortAssets = (list: AssetDetail[]) => [...list].sort((a, b) => {
    let valA: string | number
    let valB: string | number

    switch (sortKey) {
      case 'name':     valA = a.name;                      valB = b.name;                      break
      case 'category': valA = a.category;                  valB = b.category;                  break
      case 'weight':   valA = parseWeight(a.weight);       valB = parseWeight(b.weight);       break
      case 'value':    valA = parseValue(a.formattedValue); valB = parseValue(b.formattedValue); break
    }

    if (typeof valA === 'string') {
      return sortOrder === 'asc'
        ? valA.localeCompare(valB as string)
        : (valB as string).localeCompare(valA)
    }
    return sortOrder === 'asc' ? valA - (valB as number) : (valB as number) - valA
  })

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (assets.length === 0) {
    return (
      <div
        className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-2 min-h-[200px]"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xl">
          📊
        </div>
        <p className="text-[13px] text-gray-400">Sin activos registrados</p>
        <p className="text-[11px] text-gray-300">Crea cuentas para ver el detalle</p>
      </div>
    )
  }

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* ── Header principal ── */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Balance patrimonial</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {assets.length} cuenta{assets.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Patrimonio neto */}
        <div className="text-right">
          <p className="text-[11px] text-gray-400">Patrimonio neto</p>
          <p className={cn(
            'text-lg font-semibold tracking-tight',
            netWorthPositive ? 'text-gray-900' : 'text-rose-500'
          )}>
            {netWorthFormatted}
          </p>
        </div>
      </div>

      {/* ── Activos ── */}
      <AssetSection
        title="Activos"
        assets={sortAssets(activeAssets)}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        totalLabel="Total activos"
        totalValue={totalAssetsFormatted}
        totalColor="text-emerald-600"
      />

      {/* ── Pasivos ── */}
      {liabilityAssets.length > 0 ? (
        <AssetSection
          title="Pasivos"
          assets={sortAssets(liabilityAssets)}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={handleSort}
          totalLabel="Total pasivos"
          totalValue={totalLiabilitiesFormatted}
          totalColor="text-rose-500"
        />
      ) : null}

      {/* ── Footer: resumen ── */}
      <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 grid grid-cols-3 gap-4">
        <div>
          <p className="text-[11px] text-gray-400">Total activos</p>
          <p className="text-[13px] font-semibold text-emerald-600">{totalAssetsFormatted}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">Total pasivos</p>
          <p className="text-[13px] font-semibold text-rose-500">{totalLiabilitiesFormatted}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400">Neto</p>
          <p className={cn(
            'text-[13px] font-semibold',
            netWorthPositive ? 'text-gray-900' : 'text-rose-500'
          )}>
            {netWorthFormatted}
          </p>
        </div>
      </div>
    </div>
  )
}
