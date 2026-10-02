'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MonthCyclePickerProps {
  year: number
  month: number // 1-12
  label: string // ej "marzo 2026"
  onPrev: () => void
  onNext: () => void
  onSelect: (year: number, month: number) => void
  isCurrentMonth?: boolean
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function MonthCyclePicker({ year, month, label, onPrev, onNext, onSelect, isCurrentMonth }: MonthCyclePickerProps) {
  const [picking, setPicking] = useState(false)
  const [pickYear, setPickYear] = useState(year)
  const [pickMonth, setPickMonth] = useState(month)

  const handleApply = () => {
    onSelect(pickYear, pickMonth)
    setPicking(false)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 rounded-[22px] border border-zinc-200 bg-white px-2 py-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          className="size-9 rounded-lg shrink-0 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <button
          onClick={() => {
            setPickYear(year)
            setPickMonth(month)
            setPicking((v) => !v)
          }}
          className="flex-1 flex items-center justify-center gap-2 min-w-0 px-2 py-1.5 rounded-xl hover:bg-zinc-50 transition-colors"
          aria-label="Seleccionar mes"
          aria-expanded={picking}
        >
          <CalendarRange className="size-4 text-zinc-400 shrink-0" />
          <span className="text-[13px] font-semibold text-zinc-900 capitalize tracking-tight truncate">{label}</span>
          {isCurrentMonth && (
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
              Actual
            </span>
          )}
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="size-9 rounded-lg shrink-0 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          aria-label="Mes siguiente"
          disabled={isCurrentMonth}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {picking && (
        <div className="rounded-[22px] border border-zinc-200 bg-white p-4 space-y-3 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="picker-month" className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">Mes</label>
              <select
                id="picker-month"
                value={pickMonth}
                onChange={(e) => setPickMonth(Number(e.target.value))}
                className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-300"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="picker-year" className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">Anio</label>
              <select
                id="picker-year"
                value={pickYear}
                onChange={(e) => setPickYear(Number(e.target.value))}
                className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-300"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPicking(false)}
              className="h-9 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="h-9 px-4 rounded-lg text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white"
            >
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
