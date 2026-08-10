'use client'

import { useState, useMemo } from 'react'
import { Save, X, Receipt, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DriverApp, PaymentMethod, ExpenseType, DriverExpense, DriverShift, ShiftInput } from '@/types/driver'
import { DRIVER_APPS, DRIVER_APP_LABELS, PAYMENT_METHOD_LABELS, EXPENSE_TYPE_LABELS, EXPENSE_TYPES } from '@/types/driver'
import { isoToLocalDateStr } from '../utils/driver-metrics.utils'

interface ShiftFormProps {
  isPending: boolean
  onSubmit?: (data: ShiftInput) => void
  onUpdate?: (id: string, data: ShiftInput) => void
  initialData?: ShiftInput & { id?: string }
  onCancel: () => void
}

function emptyEarnings(): Record<DriverApp, Record<PaymentMethod, number>> {
  return {
    UBER: { CASH: 0, CARD: 0, QR: 0 },
    YANGO: { CASH: 0, CARD: 0, QR: 0 },
    INDRIVE: { CASH: 0, CARD: 0, QR: 0 },
  }
}

function emptyBonuses(): Record<DriverApp, number> {
  return { UBER: 0, YANGO: 0, INDRIVE: 0 }
}

function emptyCommissions(): Record<DriverApp, number> {
  return { UBER: 0, YANGO: 0, INDRIVE: 0 }
}

// Fecha local (YYYY-MM-DD) sin desfase de timezone
function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Convierte un DriverShift a ShiftInput para edición
function shiftToInput(s: DriverShift): ShiftInput {
  return {
    date: s.date ?? isoToLocalDateStr(s.createdAt) ?? localDateStr(new Date()),
    hoursWorked: s.hoursWorked ?? 0,
    startKm: s.startKm,
    endKm: s.endKm,
    earnings: s.earnings,
    bonuses: s.bonuses,
    commissions: s.commissions,
    expenses: s.expenses,
    notes: s.notes,
  }
}

export function ShiftForm({
  isPending,
  onSubmit,
  onUpdate,
  initialData,
  onCancel,
}: ShiftFormProps) {
  const defaults = initialData ?? {
    date: localDateStr(new Date()),
    hoursWorked: 0,
    startKm: null,
    endKm: null,
    earnings: emptyEarnings(),
    bonuses: emptyBonuses(),
    commissions: emptyCommissions(),
    expenses: [] as DriverExpense[],
    notes: null,
  }

  const [date, setDate] = useState<string>(defaults.date)
  const [hoursWorked, setHoursWorked] = useState<string>(defaults.hoursWorked > 0 ? String(defaults.hoursWorked) : '')
  const [startKm, setStartKm] = useState<string>(defaults.startKm != null ? String(defaults.startKm) : '')
  const [endKm, setEndKm] = useState<string>(defaults.endKm != null ? String(defaults.endKm) : '')
  const [earnings, setEarnings] = useState<Record<DriverApp, Record<PaymentMethod, number>>>(defaults.earnings)
  const [bonuses, setBonuses] = useState<Record<DriverApp, number>>(defaults.bonuses)
  const [commissions, setCommissions] = useState<Record<DriverApp, number>>(defaults.commissions)
  const [expenses, setExpenses] = useState<DriverExpense[]>(defaults.expenses)
  const [notes, setNotes] = useState(defaults.notes ?? '')

  const updateEarnings = (app: DriverApp, method: PaymentMethod, value: string) => {
    const num = parseFloat(value) || 0
    setEarnings((prev) => ({
      ...prev,
      [app]: { ...prev[app], [method]: num },
    }))
  }

  const updateBonuses = (app: DriverApp, value: string) => {
    setBonuses((prev) => ({ ...prev, [app]: parseFloat(value) || 0 }))
  }

  const updateCommissions = (app: DriverApp, value: string) => {
    setCommissions((prev) => ({ ...prev, [app]: parseFloat(value) || 0 }))
  }

  const addExpense = () => {
    setExpenses((prev) => [...prev, { type: 'OTHER' as ExpenseType, amount: 0, paymentMethod: 'CASH' as PaymentMethod }])
  }

  const updateExpense = (index: number, field: keyof DriverExpense, value: any) => {
    setExpenses((prev) => prev.map((e, i) => i === index ? { ...e, [field]: field === 'amount' ? (parseFloat(value) || 0) : value } : e))
  }

  const removeExpense = (index: number) => {
    setExpenses((prev) => prev.filter((_, i) => i !== index))
  }

  // Km recorrido con wrap de 3 dígitos
  const kmPreview = useMemo(() => {
    if (!startKm || !endKm) return null
    const s = parseInt(startKm, 10)
    const e = parseInt(endKm, 10)
    if (isNaN(s) || isNaN(e)) return null
    return e >= s ? e - s : 1000 + e - s
  }, [startKm, endKm])

  // Totales
  const totals = useMemo(() => {
    let totalCash = 0, totalCard = 0, totalQr = 0, totalBonuses = 0, totalCommissions = 0
    for (const app of DRIVER_APPS) {
      totalCash += earnings[app].CASH
      totalCard += earnings[app].CARD
      totalQr += earnings[app].QR
      totalBonuses += bonuses[app]
      totalCommissions += commissions[app]
    }
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const gross = totalCash + totalCard + totalQr + totalBonuses
    const pending = totalCard + totalBonuses
    const liquid = totalCash + totalQr - totalCommissions - totalExpenses
    return { totalCash, totalCard, totalQr, totalBonuses, totalCommissions, totalExpenses, gross, pending, liquid }
  }, [earnings, bonuses, commissions, expenses])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (totals.gross === 0 && totals.totalExpenses === 0) return

    const data: ShiftInput = {
      date,
      hoursWorked: parseFloat(hoursWorked) || 0,
      startKm: startKm !== '' ? parseInt(startKm, 10) : null,
      endKm: endKm !== '' ? parseInt(endKm, 10) : null,
      earnings,
      bonuses,
      commissions,
      expenses,
      notes: notes || null,
    }

    if (initialData?.id && onUpdate) {
      onUpdate(initialData.id, data)
    } else {
      onSubmit?.(data)
    }
  }

  const isEditMode = !!initialData?.id

  return (
    <div className="rounded-[22px] bg-white p-4 sm:p-6 space-y-6"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#4F6A35] flex items-center justify-center text-white">
            <Receipt className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-[-0.01em]">
              {isEditMode ? 'Editar Turno' : 'Registrar Turno'}
            </h3>
            <p className="text-[11px] text-[#6E6E73]">Registro manual — se genera al final del día</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="size-8 rounded-lg text-[#6E6E73]">
          <X className="size-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Fecha + Horas ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-[#6E6E73] font-bold">Fecha</Label>
            <Input
              type="date"
              value={date}
              max={localDateStr(new Date())}
              onChange={(e) => setDate(e.target.value)}
              required
              className="h-12 bg-transparent border-t-0 border-x-0 border-b border-[rgba(0,0,0,0.06)] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#4F6A35] transition-colors shadow-none text-sm font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-[#6E6E73] font-bold">Horas trabajadas</Label>
            <Input
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              placeholder="Ej: 8"
              required
              className="h-12 bg-transparent border-t-0 border-x-0 border-b border-[rgba(0,0,0,0.06)] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#4F6A35] transition-colors shadow-none text-sm font-medium tabular-nums"
            />
          </div>
        </div>

        {/* ── Odómetro ── */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-widest text-[#6E6E73] font-bold">
            Odómetro (últimos 3 dígitos)
          </Label>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div>
              <Input
                type="number"
                min="0"
                max="999"
                value={startKm}
                onChange={(e) => {
                  const val = e.target.value
                  if (val.length <= 3) setStartKm(val)
                }}
                placeholder="Inicio"
                className="h-12 bg-transparent border-t-0 border-x-0 border-b border-[rgba(0,0,0,0.06)] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#4F6A35] transition-colors shadow-none text-xl font-light tabular-nums text-center"
              />
              <p className="text-[9px] text-[#6E6E73] text-center mt-1 uppercase tracking-wider">Inicio</p>
            </div>
            <span className="text-[#6E6E73]/60 text-lg pb-2">→</span>
            <div>
              <Input
                type="number"
                min="0"
                max="999"
                value={endKm}
                onChange={(e) => {
                  const val = e.target.value
                  if (val.length <= 3) setEndKm(val)
                }}
                placeholder="Fin"
                className="h-12 bg-transparent border-t-0 border-x-0 border-b border-[rgba(0,0,0,0.06)] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#4F6A35] transition-colors shadow-none text-xl font-light tabular-nums text-center"
              />
              <p className="text-[9px] text-[#6E6E73] text-center mt-1 uppercase tracking-wider">Fin</p>
            </div>
          </div>
          {kmPreview != null && (
            <p className="text-[11px] text-[#4F6A35] font-semibold text-center">
              +{kmPreview} km recorridos
            </p>
          )}
        </div>

        {/* ── Ingresos por app ── */}
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-[#6E6E73] font-bold">Ingresos por app</p>

          {/* Header de columnas */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] gap-2 text-[9px] uppercase tracking-wider text-[#6E6E73] font-bold px-1">
            <span>App</span>
            <span>Efectivo</span>
            <span>Tarjeta</span>
            <span>QR</span>
            <span>Bonos</span>
            <span>Comisión</span>
          </div>

          {DRIVER_APPS.map((app) => (
            <AppRow
              key={app}
              app={app}
              label={DRIVER_APP_LABELS[app]}
              earnings={earnings[app]}
              bonus={bonuses[app]}
              commission={commissions[app]}
              onEarningsChange={(method, val) => updateEarnings(app, method, val)}
              onBonusChange={(val) => updateBonuses(app, val)}
              onCommissionChange={(val) => updateCommissions(app, val)}
            />
          ))}
        </div>

        {/* ── Gastos del turno ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-[#6E6E73] font-bold">Gastos del turno</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addExpense}
              className="h-7 text-[10px] font-bold text-[#4F6A35] hover:text-[#3C5230]"
            >
              <Plus className="size-3 mr-1" />
              Agregar
            </Button>
          </div>

          {expenses.length === 0 && (
            <p className="text-[11px] text-[#6E6E73] italic text-center py-4">Sin gastos registrados</p>
          )}

          <div className="space-y-2">
            {expenses.map((expense, index) => (
              <ExpenseRow
                key={index}
                expense={expense}
                onChange={(field, val) => updateExpense(index, field, val)}
                onRemove={() => removeExpense(index)}
              />
            ))}
          </div>
        </div>

        {/* ── Notas ── */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-widest text-[#6E6E73] font-bold">Notas</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Lluvia, tráfico, eventos…"
            className="h-12 bg-transparent border-t-0 border-x-0 border-b border-[rgba(0,0,0,0.06)] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#4F6A35] transition-colors shadow-none"
          />
        </div>

        {/* ── Resumen ── */}
        <SummaryCard totals={totals} hoursWorked={parseFloat(hoursWorked) || 0} />

        {/* ── Acciones ── */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}
            className="flex-1 h-12 rounded-xl border-[rgba(0,0,0,0.06)] text-[#6E6E73] font-semibold">
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending || (totals.gross === 0 && totals.totalExpenses === 0)}
            className="flex-1 h-12 rounded-xl bg-[#4F6A35] hover:bg-[#3C5230] text-white font-semibold shadow-lg active:scale-[0.98] transition-all">
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="size-4" />
                {isEditMode ? 'Guardar cambios' : 'Guardar y registrar'}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── AppRow ────────────────────────────────────────────────────────────────────
function AppRow({
  app, label, earnings, bonus, commission,
  onEarningsChange, onBonusChange, onCommissionChange,
}: {
  app: DriverApp
  label: string
  earnings: Record<PaymentMethod, number>
  bonus: number
  commission: number
  onEarningsChange: (method: PaymentMethod, val: string) => void
  onBonusChange: (val: string) => void
  onCommissionChange: (val: string) => void
}) {
  const borderColors: Record<DriverApp, string> = {
    UBER: 'border-blue-200/50',
    YANGO: 'border-orange-200/50',
    INDRIVE: 'border-emerald-200/50',
  }

  return (
    <div className={`grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] gap-2 items-center rounded-xl border p-2.5 ${borderColors[app]} bg-white`}>
      <span className="text-[11px] font-bold text-foreground">{label}</span>
      <CellInput value={earnings.CASH} onChange={(v) => onEarningsChange('CASH', v)} />
      <CellInput value={earnings.CARD} onChange={(v) => onEarningsChange('CARD', v)} />
      <CellInput value={earnings.QR} onChange={(v) => onEarningsChange('QR', v)} />
      <CellInput value={bonus} onChange={onBonusChange} />
      <CellInput value={commission} onChange={onCommissionChange} />
    </div>
  )
}

function CellInput({ value, onChange }: { value: number; onChange: (val: string) => void }) {
  return (
    <Input
      type="number"
      step="0.01"
      min="0"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0"
      className="h-9 bg-transparent border-0 rounded-lg text-xs font-semibold tabular-nums text-center focus:ring-0 focus:bg-[#F2F9E3]/40"
    />
  )
}

// ─── ExpenseRow ────────────────────────────────────────────────────────────────
function ExpenseRow({
  expense, onChange, onRemove,
}: {
  expense: DriverExpense
  onChange: (field: keyof DriverExpense, val: any) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={expense.type}
        onChange={(e) => onChange('type', e.target.value)}
        className="h-10 rounded-lg bg-transparent border border-[rgba(0,0,0,0.06)] text-xs font-medium px-2 focus:outline-none focus:border-[#4F6A35]"
      >
        {EXPENSE_TYPES.map((t) => (
          <option key={t} value={t}>{EXPENSE_TYPE_LABELS[t]}</option>
        ))}
      </select>
      <Input
        type="number"
        step="0.01"
        min="0"
        value={expense.amount || ''}
        onChange={(e) => onChange('amount', e.target.value)}
        placeholder="Monto"
        className="h-10 bg-transparent border border-[rgba(0,0,0,0.06)] rounded-lg text-xs font-semibold tabular-nums w-24 focus:ring-0"
      />
      <select
        value={expense.paymentMethod}
        onChange={(e) => onChange('paymentMethod', e.target.value)}
        className="h-10 rounded-lg bg-transparent border border-[rgba(0,0,0,0.06)] text-xs font-medium px-2 focus:outline-none focus:border-[#4F6A35]"
      >
        {(['CASH', 'QR'] as PaymentMethod[]).map((m) => (
          <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
        ))}
      </select>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove}
        className="size-8 rounded-lg text-[#6E6E73]/60 hover:text-[#B5543D] shrink-0">
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

// ─── SummaryCard ───────────────────────────────────────────────────────────────
function SummaryCard({ totals, hoursWorked }: {
  totals: {
    totalCash: number; totalCard: number; totalQr: number
    totalBonuses: number; totalCommissions: number; totalExpenses: number
    gross: number; pending: number; liquid: number
  }
  hoursWorked: number
}) {
  if (totals.gross === 0 && totals.totalExpenses === 0) return null

  return (
    <div className="rounded-xl bg-[#F2F9E3]/40 border border-[rgba(0,0,0,0.06)] p-4 space-y-2.5 text-[12px]">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#6E6E73] font-bold">
        <Receipt className="size-3" />
        Resumen
      </div>

      <div className="space-y-1">
        <Row label="Efectivo" value={totals.totalCash} color="text-[#4F6A35]" />
        <Row label="Tarjeta" value={totals.totalCard} color="text-blue-600" />
        <Row label="QR" value={totals.totalQr} color="text-purple-600" />
        <Row label="Bonos" value={totals.totalBonuses} color="text-amber-600" />
        <div className="border-t border-[rgba(0,0,0,0.06)] pt-1 mt-1">
          <Row label="Total bruto" value={totals.gross} color="text-foreground font-bold" />
        </div>
        <Row label="Pendiente en app (tarjeta + bonos)" value={-totals.pending} color="text-[#6E6E73]" />
        <Row label="Comisiones" value={-totals.totalCommissions} color="text-[#B5543D]" />
        <Row label="Gastos" value={-totals.totalExpenses} color="text-[#B5543D]" />
      </div>

      <div className="border-t-2 border-[rgba(0,0,0,0.16)] pt-2 flex justify-between items-center">
        <span className="text-[11px] font-bold text-[#6E6E73] uppercase tracking-wide">Neto líquido</span>
        <span className={`text-base font-bold tabular-nums ${totals.liquid >= 0 ? 'text-[#4F6A35]' : 'text-[#B5543D]'}`}>
          Bs {totals.liquid.toFixed(2)}
        </span>
      </div>

      {hoursWorked > 0 && (
        <p className="text-[10px] text-[#6E6E73] text-right">
          {totals.liquid / hoursWorked > 0
            ? `Bs ${(totals.liquid / hoursWorked).toFixed(2)}/hora`
            : `Bs 0.00/hora`}
        </p>
      )}
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: number; color: string }) {
  if (value === 0) return null
  return (
    <div className="flex justify-between items-center">
      <span className="text-[#6E6E73]">{label}</span>
      <span className={`tabular-nums font-semibold ${color}`}>
        {value > 0 ? '+' : ''}{value.toFixed(2)}
      </span>
    </div>
  )
}
