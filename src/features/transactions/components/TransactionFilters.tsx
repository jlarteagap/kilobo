// features/transactions/components/TransactionFilters.tsx
"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronDown, X, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

import type { Account } from "@/types/account"
import type { Category } from "@/types/category"
import type { TransactionTypeFilter, TransactionFilters } from "../hooks/useTransactionFilters"
import type { Project } from '@/types/project'

// ─── Tipos de transacción ─────────────────────────────────────────────────────
const TYPE_OPTIONS: { value: TransactionTypeFilter; label: string; color: string }[] = [
  { value: 'ALL',      label: 'Todos',         color: 'text-gray-600'    },
  { value: 'INCOME',   label: 'Ingresos',      color: 'text-emerald-600' },
  { value: 'EXPENSE',  label: 'Gastos',        color: 'text-rose-500'    },
  { value: 'TRANSFER', label: 'Transferencias', color: 'text-blue-500'   },
  { value: 'SAVING',   label: 'Ahorros',       color: 'text-violet-500'  },
]

// ─── Dropdown genérico ────────────────────────────────────────────────────────
function FilterDropdown({
  label,
  isActive,
  isOpen,
  onToggle,
  onClear,
  children,
  align = 'left',
}: {
  label:    string
  isActive: boolean
  isOpen:   boolean
  onToggle: () => void
  onClear:  () => void
  children: React.ReactNode
  align?:   'left' | 'right'
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200',
          isActive || isOpen
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200 hover:text-gray-700'
        )}
      >
        <span>{label}</span>
        {isActive ? (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onClear() }}
            className="hover:opacity-70 transition-opacity"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronDown className={cn(
            'w-3 h-3 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} />
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-1.5 z-50 bg-white rounded-2xl min-w-[180px]',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Item de dropdown ─────────────────────────────────────────────────────────
function DropdownItem({
  label,
  isSelected,
  onClick,
  color,
  dot,
}: {
  label:      string
  isSelected: boolean
  onClick:    () => void
  color?:     string
  dot?:       string  // color hex para el dot
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-[13px] transition-colors duration-100',
        isSelected
          ? 'bg-gray-900 text-white font-medium'
          : 'text-gray-600 hover:bg-gray-50'
      )}
    >
      {dot && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: isSelected ? 'white' : dot }}
        />
      )}
      <span className={cn(!dot && color && !isSelected && color)}>
        {label}
      </span>
    </button>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
interface TransactionFiltersProps {
  filters:              TransactionFilters
  accounts:             Account[]
  categories:           Category[]
  projects:             Project[]
  availableTags:        string[]
  availableCategoryIds: string[]
  activeFilterCount:    number
  onAccountChange:      (id: string | null) => void
  onCategoryChange:     (id: string | null) => void
  onProjectChange:      (id: string | null) => void
  onTagChange:          (tag: string | null) => void
  onTypeChange:         (type: TransactionTypeFilter) => void
  onReset:              () => void
}

export function TransactionFilters({
  filters,
  accounts,
  categories,
  projects,
  availableTags,
  availableCategoryIds,
  activeFilterCount,
  onAccountChange,
  onCategoryChange,
  onProjectChange,
  onTagChange,
  onTypeChange,
  onReset,
}: TransactionFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<
    'account' | 'category' | 'tag' | 'type' | 'project' | null
  >(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggle = (name: typeof openDropdown) =>
    setOpenDropdown((prev) => prev === name ? null : name)

  // ── Categorías disponibles en el período actual ────────────────────────────
  const visibleCategories = categories


  // ── Labels activos ─────────────────────────────────────────────────────────
  const activeAccount  = accounts.find((a) => a.id === filters.accountId)
  const activeCategory = categories.find((c) => c.id === filters.categoryId)
  const activeProject = projects.find((p) => p.id === filters.projectId)
  const activeType     = TYPE_OPTIONS.find((t) => t.value === filters.type)

  return (
    <div ref={containerRef} className="flex items-center gap-2 flex-wrap">

      {/* ── Icono filtros + badge ── */}
      <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filtros</span>
        {activeFilterCount > 0 && (
          <span className="bg-gray-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </div>

      <div className="w-px h-4 bg-gray-200" />

      {/* ── Dropdown Tipo ── */}
      <FilterDropdown
        label={filters.type === 'ALL' ? 'Tipo' : activeType?.label ?? 'Tipo'}
        isActive={filters.type !== 'ALL'}
        isOpen={openDropdown === 'type'}
        onToggle={() => toggle('type')}
        onClear={() => { onTypeChange('ALL'); setOpenDropdown(null) }}
      >
        <div className="py-1">
          {TYPE_OPTIONS.map((opt) => (
            <DropdownItem
              key={opt.value}
              label={opt.label}
              color={opt.color}
              isSelected={filters.type === opt.value}
              onClick={() => {
                onTypeChange(opt.value)
                setOpenDropdown(null)
              }}
            />
          ))}
        </div>
      </FilterDropdown>
<FilterDropdown
  label={
    filters.projectId === '__personal__'
      ? 'Personal'
      : (activeProject?.name ?? 'Proyecto')
  }
  isActive={!!filters.projectId}
  isOpen={openDropdown === 'project'}
  onToggle={() => toggle('project')}
  onClear={() => { onProjectChange(null); setOpenDropdown(null) }}
>
  <div className="py-1">
    <DropdownItem
      label="Personal (sin proyecto)"
      isSelected={filters.projectId === '__personal__'}
      onClick={() => { onProjectChange('__personal__'); setOpenDropdown(null) }}
    />
    {projects.length > 0 && (
      <div className="h-px bg-gray-100 mx-3 my-1" />
    )}
    {projects.map((p) => (
      <DropdownItem
        key={p.id}
        label={p.icon ? `${p.icon} ${p.name}` : p.name}
        dot={p.color}
        isSelected={filters.projectId === p.id}
        onClick={() => { onProjectChange(p.id); setOpenDropdown(null) }}
      />
    ))}
  </div>
</FilterDropdown>
      {/* ── Dropdown Cuenta ── */}
      <FilterDropdown
        label={activeAccount?.name ?? 'Cuenta'}
        isActive={!!filters.accountId}
        isOpen={openDropdown === 'account'}
        onToggle={() => toggle('account')}
        onClear={() => { onAccountChange(null); setOpenDropdown(null) }}
      >
        <div className="py-1">
          {accounts.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-gray-400">
              No hay cuentas disponibles
            </p>
          ) : (
            accounts.map((acc) => (
              <DropdownItem
                key={acc.id}
                label={acc.name}
                isSelected={filters.accountId === acc.id}
                onClick={() => {
                  onAccountChange(acc.id)
                  setOpenDropdown(null)
                }}
              />
            ))
          )}
        </div>
      </FilterDropdown>

      {/* ── Dropdown Categoría ── */}
      <FilterDropdown
        label={activeCategory?.name ?? 'Categoría'}
        isActive={!!filters.categoryId}
        isOpen={openDropdown === 'category'}
        onToggle={() => toggle('category')}
        onClear={() => { onCategoryChange(null); setOpenDropdown(null) }}
      >
        <div className="py-1 max-h-[240px] overflow-y-auto">
          {visibleCategories.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-gray-400">
              Sin categorías en este período
            </p>
          ) : (
            visibleCategories.map((cat) => (
              <DropdownItem
                key={cat.id}
                label={cat.name}
                dot={cat.color ?? '#9ca3af'}
                isSelected={filters.categoryId === cat.id}
                onClick={() => {
                  onCategoryChange(cat.id)
                  setOpenDropdown(null)
                }}
              />
            ))
          )}
        </div>
      </FilterDropdown>

      {/* ── Dropdown Tag ── */}
      <FilterDropdown
        label={filters.tag ?? 'Tag'}
        isActive={!!filters.tag}
        isOpen={openDropdown === 'tag'}
        onToggle={() => toggle('tag')}
        onClear={() => { onTagChange(null); setOpenDropdown(null) }}
        align="right"
      >
        <div className="py-1 max-h-[200px] overflow-y-auto">
          {availableTags.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-gray-400">
              Sin tags en este período
            </p>
          ) : (
            availableTags.map((tag) => (
              <DropdownItem
                key={tag}
                label={tag}
                isSelected={filters.tag === tag}
                onClick={() => {
                  onTagChange(tag)
                  setOpenDropdown(null)
                }}
              />
            ))
          )}
        </div>
      </FilterDropdown>

      {/* ── Reset todos los filtros ── */}
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={() => { onReset(); setOpenDropdown(null) }}
          className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-rose-500 transition-colors duration-150"
        >
          <X className="w-3 h-3" />
          Limpiar
        </button>
      )}
    </div>
  )
}