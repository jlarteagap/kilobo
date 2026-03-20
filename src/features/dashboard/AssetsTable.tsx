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
  className,
  onSort,
}: {
  label:     string
  column:    SortKey
  sortKey:   SortKey
  sortOrder: SortOrder
  align?:    'left' | 'right'
  className?: string
  onSort:    (col: SortKey) => void
}) {
  return (
    <th className={cn(
      'px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider',
      align === 'right' && 'text-right',
      className
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
    <tr className="hover:bg-muted/40 transition-colors duration-150">
      {/* Activo */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${asset.color}15` }}
          >
            <asset.icon className="w-4.5 h-4.5" style={{ color: asset.color }} />
          </div>
          <span className="font-bold text-foreground text-[13px] tracking-tight">{asset.name}</span>
        </div>
      </td>

      {/* Categoría */}
      <td className="px-6 py-4 hidden sm:table-cell">
        <span className="text-[12px] font-medium text-muted-foreground/70">{asset.category}</span>
      </td>

      {/* Peso */}
      <td className="px-6 py-4 hidden sm:table-cell">
        <Badge
          variant="secondary"
          className="text-[10px] font-bold rounded-full bg-muted text-muted-foreground/80 border-none px-2.5"
        >
          {asset.weight}
        </Badge>
      </td>

      {/* Valor */}
      <td className="px-6 py-4 text-right">
        <span className="text-[13px] font-bold text-foreground tabular-nums">
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
      <div className="px-6 py-3 bg-muted/30 border-y border-border/40 flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
          {title}
        </span>
        <span className={cn('text-[11px] font-bold tabular-nums', totalColor)}>
          {totalValue}
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-50">
            <SortableHeader label="Activo"    column="name"     sortKey={sortKey} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader className="hidden sm:table-cell" label="Categoría" column="category" sortKey={sortKey} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader className="hidden sm:table-cell" label="Peso"      column="weight"   sortKey={sortKey} sortOrder={sortOrder} onSort={onSort} />
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
      className="bg-card rounded-3xl overflow-hidden border border-border/40"
      style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.02)' }}
    >
      {/* ── Header principal ── */}
      <div className="px-6 py-6 border-b border-border/40 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">Balance patrimonial</h3>
          <p className="text-[11px] text-muted-foreground/60">
            Detalle por cuenta y categoría
          </p>
        </div>
        {/* Patrimonio neto */}
        <div className="text-right">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">Patrimonio neto</p>
          <p className={cn(
            'text-2xl font-bold tabular-nums tracking-tight',
            netWorthPositive ? 'text-foreground' : 'text-debt'
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
      <div className="px-6 py-6 bg-muted/20 border-t border-border/40 grid grid-cols-3 gap-8">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Total activos</p>
          <p className="text-[15px] font-bold text-growth tabular-nums tracking-tight">{totalAssetsFormatted}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Total pasivos</p>
          <p className="text-[15px] font-bold text-debt tabular-nums tracking-tight">{totalLiabilitiesFormatted}</p>
        </div>
        <div className="text-right flex flex-col gap-1">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Balance Neto</p>
          <p className={cn(
            'text-[15px] font-bold tabular-nums tracking-tight',
            netWorthPositive ? 'text-foreground' : 'text-debt'
          )}>
            {netWorthFormatted}
          </p>
        </div>
      </div>
    </div>
  )
}
