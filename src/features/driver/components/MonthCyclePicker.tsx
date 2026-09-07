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
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card dark:bg-card px-3 py-2 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          className="size-9 rounded-xl shrink-0"
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
          className="flex-1 flex items-center justify-center gap-2 min-w-0 px-2 py-1.5 rounded-xl hover:bg-secondary dark:hover:bg-muted transition-colors"
          aria-label="Seleccionar mes"
          aria-expanded={picking}
        >
          <CalendarRange className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-bold text-foreground capitalize tracking-tight truncate">{label}</span>
          {!isCurrentMonth && (
            <span className="hidden sm:inline text-xs text-muted-foreground">· Ciclo</span>
          )}
          {isCurrentMonth && (
            <span className="hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-full bg-secondary dark:bg-muted text-secondary-foreground border border-border">Actual</span>
          )}
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="size-9 rounded-xl shrink-0"
          aria-label="Mes siguiente"
          disabled={isCurrentMonth}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {picking && (
        <div className="rounded-xl border border-border bg-card dark:bg-card p-4 space-y-3 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="picker-month" className="text-xs font-semibold text-foreground">Mes</label>
              <select
                id="picker-month"
                value={pickMonth}
                onChange={(e) => setPickMonth(Number(e.target.value))}
                className="flex h-11 w-full rounded-xl border border-input bg-card dark:bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="picker-year" className="text-xs font-semibold text-foreground">Anio</label>
              <select
                id="picker-year"
                value={pickYear}
                onChange={(e) => setPickYear(Number(e.target.value))}
                className="flex h-11 w-full rounded-xl border border-input bg-card dark:bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setPicking(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleApply} className="rounded-xl">
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
