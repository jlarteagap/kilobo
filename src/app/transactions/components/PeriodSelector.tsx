// features/transactions/components/PeriodSelector.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Calendar, X } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"

import { getAvailableMonths, getPeriodLabel } from "@/utils/date.utils"
import { DEFAULT_PERIOD } from "@/types/period"
import type { Period } from "@/types/period"

interface PeriodSelectorProps {
  value:    Period
  onChange: (period: Period) => void
}

// ─── Tab principal ────────────────────────────────────────────────────────────
const MAIN_TABS: { type: Period['type']; label: string }[] = [
  { type: 'THIS_WEEK',  label: 'Semana'        },
  { type: 'THIS_MONTH', label: 'Este mes'      },
  { type: 'LAST_MONTH', label: 'Mes anterior'  },
]

// ─── Dropdown de meses ────────────────────────────────────────────────────────
function MonthPicker({
  value,
  onChange,
  onClose,
}: {
  value:    Period
  onChange: (period: Period) => void
  onClose:  () => void
}) {
  const months = getAvailableMonths()

  return (
    <div className="absolute top-full left-0 mt-1.5 z-50 bg-white rounded-2xl overflow-hidden min-w-[180px]"
      style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <div className="px-3 py-2 border-b border-[rgba(0,0,0,0.06)]">
        <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider">
          Seleccionar mes
        </p>
      </div>
      <div className="max-h-[240px] overflow-y-auto py-1">
        {months.map(({ year, month, label }) => {
          const isSelected =
            value.type === 'CUSTOM_MONTH' &&
            value.year  === year &&
            value.month === month

          return (
            <button
              key={`${year}-${month}`}
              type="button"
              onClick={() => {
                onChange({ type: 'CUSTOM_MONTH', year, month })
                onClose()
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-[13px] transition-colors duration-100 capitalize',
                isSelected
                  ? 'bg-[#4F6A35] text-white font-medium'
                  : 'text-[#6E6E73] hover:bg-[#F2F9E3]/40'
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Dropdown de rango personalizado ─────────────────────────────────────────
function RangePicker({
  value,
  onChange,
  onClose,
}: {
  value:    Period
  onChange: (period: Period) => void
  onClose:  () => void
}) {
  const today = format(new Date(), 'yyyy-MM-dd')

  const [from, setFrom] = useState(
    value.type === 'CUSTOM_RANGE' ? value.from : today
  )
  const [to, setTo] = useState(
    value.type === 'CUSTOM_RANGE' ? value.to : today
  )

  const isValid = from && to && from <= to

  return (
    <div
      className="absolute top-full right-0 mt-1.5 z-50 bg-white rounded-2xl p-4 min-w-[260px]"
      style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-3">
        Rango personalizado
      </p>

      <div className="space-y-3">
        {/* Desde */}
        <div>
          <label className="text-[12px] font-medium text-[#6E6E73] block mb-1">
            Desde
          </label>
          <input
            type="date"
            value={from}
            max={to || today}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full text-[13px] px-3 py-2 rounded-xl bg-[#F2F9E3]/40 border-0 focus:outline-none focus:ring-2 focus:ring-[#5F7D42]/30"
          />
        </div>

        {/* Hasta */}
        <div>
          <label className="text-[12px] font-medium text-[#6E6E73] block mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(e) => setTo(e.target.value)}
            className="w-full text-[13px] px-3 py-2 rounded-xl bg-[#F2F9E3]/40 border-0 focus:outline-none focus:ring-2 focus:ring-[#5F7D42]/30"
          />
        </div>

        {/* Error */}
        {from > to && (
          <p className="text-[12px] text-[#B5543D]">
            La fecha de inicio debe ser anterior a la fecha final
          </p>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-[13px] font-medium text-[#6E6E73] rounded-xl hover:bg-[#F2F9E3]/40 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!isValid}
            onClick={() => {
              if (!isValid) return
              onChange({ type: 'CUSTOM_RANGE', from, to })
              onClose()
            }}
            className={cn(
              'flex-1 py-2 text-[13px] font-medium rounded-xl transition-all',
              isValid
                ? 'bg-[#4F6A35] text-white hover:bg-[#3C5230]'
                : 'bg-[#F2F9E3]/40 text-[#6E6E73]/50 cursor-not-allowed'
            )}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [openDropdown, setOpenDropdown] = useState<'months' | 'range' | null>(null)
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

  const isMainTab    = (type: string) => value.type === type
  const isMonthsOpen = openDropdown === 'months'
  const isRangeOpen  = openDropdown === 'range'

  const isCustomMonth = value.type === 'CUSTOM_MONTH'
  const isCustomRange = value.type === 'CUSTOM_RANGE'

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "flex items-center gap-2 overflow-x-auto pb-4 -mb-4 px-0.5 no-scrollbar",
        "md:flex-wrap md:overflow-visible md:pb-0 md:mb-0 md:px-0"
      )}
    >

      {/* ── Tabs principales ── */}
      <div className="flex items-center gap-1 p-1 bg-[#F2F9E3]/40 rounded-xl">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.type}
            type="button"
            onClick={() => {
              onChange({ type: tab.type } as Period)
              setOpenDropdown(null)
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap',
              isMainTab(tab.type)
                ? 'bg-white text-foreground shadow-sm'
                : 'text-[#6E6E73] hover:text-[#6E6E73]'
            )}
          >
            {tab.label}
          </button>
        ))}

        {/* ── Dropdown otros meses ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown(isMonthsOpen ? null : 'months')}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap',
              isCustomMonth || isMonthsOpen
                ? 'bg-white text-foreground shadow-sm'
                : 'text-[#6E6E73] hover:text-[#6E6E73]'
            )}
          >
            {isCustomMonth
              ? getPeriodLabel(value)
              : 'Otros'
            }
            <ChevronDown className={cn(
              'w-3 h-3 transition-transform duration-200',
              isMonthsOpen && 'rotate-180'
            )} />
          </button>

          {isMonthsOpen && (
            <MonthPicker
              value={value}
              onChange={onChange}
              onClose={() => setOpenDropdown(null)}
            />
          )}
        </div>
      </div>

      {/* ── Rango personalizado — fuera del grupo ── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenDropdown(isRangeOpen ? null : 'range')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-200',
            isCustomRange || isRangeOpen
              ? 'bg-[#4F6A35] text-white border-[#4F6A35]'
              : 'bg-white text-[#6E6E73] border-[rgba(0,0,0,0.08)] hover:border-[rgba(0,0,0,0.16)] hover:text-foreground'
          )}
        >
          <Calendar className="w-3 h-3" />
          {isCustomRange
            ? `${value.from} → ${value.to}`
            : 'Rango'
          }
          {isCustomRange && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(DEFAULT_PERIOD)
                setOpenDropdown(null)
              }}
              className="ml-0.5 hover:opacity-70"
            >
              <X className="w-3 h-3" />
            </span>
          )}
        </button>

        {isRangeOpen && (
          <RangePicker
            value={value}
            onChange={onChange}
            onClose={() => setOpenDropdown(null)}
          />
        )}
      </div>

      {/* ── Chip del período activo — solo para custom ── */}
      {(isCustomMonth || isCustomRange) && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_PERIOD)}
          className="flex items-center gap-1 text-[11px] text-[#6E6E73] hover:text-[#6E6E73] transition-colors"
        >
          <X className="w-3 h-3" />
          Limpiar
        </button>
      )}
    </div>
  )
}