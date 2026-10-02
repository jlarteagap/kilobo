'use client'

import { useState, useMemo } from 'react'
import { Save, X, Receipt, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { DriverApp, PaymentMethod, ExpenseType, DriverExpense, DriverShift, ShiftInput, TipsByMethod, ShiftMetrics } from '@/types/driver'
import { DRIVER_APPS, DRIVER_APP_LABELS, PAYMENT_METHOD_LABELS, EXPENSE_TYPE_LABELS, EXPENSE_TYPES, emptyTips, computeShiftMetrics } from '@/types/driver'
import { isoToLocalDateStr, APP_BADGE_CLASS } from '../utils/driver-metrics.utils'

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

function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shiftToInput(s: DriverShift): ShiftInput {
  return {
    date: s.date ?? isoToLocalDateStr(s.createdAt) ?? localDateStr(new Date()),
    hoursWorked: s.hoursWorked ?? 0,
    startKm: s.startKm,
    endKm: s.endKm,
    earnings: s.earnings,
    bonuses: s.bonuses,
    commissions: s.commissions,
    tips: s.tips,
    expenses: s.expenses,
    notes: s.notes,
  }
}

// ─── Helpers de campos ─────────────────────────────────────────────────────────
const fieldClass =
  'h-11 bg-white border-zinc-200 rounded-xl text-sm text-zinc-900 focus-visible:ring-zinc-400/30'

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <Label
      htmlFor={htmlFor}
      className="block text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500"
    >
      {children}
    </Label>
  )
}

function AmountField({
  id, label, value, onChange,
}: {
  id: string
  label: string
  value: string | number
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[11px] font-medium text-zinc-500">{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className={`${fieldClass} font-semibold tabular-nums`}
      />
    </div>
  )
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
    tips: emptyTips(),
    expenses: [] as DriverExpense[],
    notes: null,
  }

  const [activeApp, setActiveApp] = useState<DriverApp>(DRIVER_APPS[0])
  const [date, setDate] = useState<string>(defaults.date)
  const [hoursWorked, setHoursWorked] = useState<string>(defaults.hoursWorked > 0 ? String(defaults.hoursWorked) : '')
  const [startKm, setStartKm] = useState<string>(defaults.startKm != null ? String(defaults.startKm) : '')
  const [endKm, setEndKm] = useState<string>(defaults.endKm != null ? String(defaults.endKm) : '')
  const [earnings, setEarnings] = useState<Record<DriverApp, Record<PaymentMethod, number>>>(defaults.earnings)
  const [bonuses, setBonuses] = useState<Record<DriverApp, number>>(defaults.bonuses)
  const [commissions, setCommissions] = useState<Record<DriverApp, number>>(defaults.commissions)
  const [tips, setTips] = useState<Record<DriverApp, TipsByMethod>>(defaults.tips ?? emptyTips())
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

  const updateTips = (app: DriverApp, method: keyof TipsByMethod, value: string) => {
    setTips((prev) => ({ ...prev, [app]: { ...prev[app], [method]: parseFloat(value) || 0 } }))
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

  const kmPreview = useMemo(() => {
    if (!startKm || !endKm) return null
    const s = parseInt(startKm, 10)
    const e = parseInt(endKm, 10)
    if (isNaN(s) || isNaN(e)) return null
    return e >= s ? e - s : 1000 + e - s
  }, [startKm, endKm])

  // Misma función que usa el servicio al guardar: el preview no puede mentir
  const totals = useMemo(() => computeShiftMetrics({ earnings, bonuses, commissions, tips, expenses }), [earnings, bonuses, commissions, tips, expenses])

  const appTotals = useMemo(() => {
    const map: Record<DriverApp, number> = { UBER: 0, YANGO: 0, INDRIVE: 0 }
    for (const app of DRIVER_APPS) {
      map[app] = earnings[app].CASH + earnings[app].CARD + earnings[app].QR + bonuses[app] + (tips[app]?.CASH ?? 0) + (tips[app]?.QR ?? 0)
    }
    return map
  }, [earnings, bonuses, tips])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (totals.grossEarnings === 0 && totals.totalExpenses === 0) return

    const data: ShiftInput = {
      date,
      hoursWorked: parseFloat(hoursWorked) || 0,
      startKm: startKm !== '' ? parseInt(startKm, 10) : null,
      endKm: endKm !== '' ? parseInt(endKm, 10) : null,
      earnings,
      bonuses,
      commissions,
      tips,
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
    <div className="rounded-[22px] bg-white border border-zinc-200 p-5 sm:p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
            <Receipt className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold text-zinc-900 tracking-tight leading-none">
              {isEditMode ? 'Editar turno' : 'Registrar turno'}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">Al final del dia</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="size-8 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 shrink-0"
          aria-label="Cancelar"
        >
          <X className="size-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fecha + Horas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="shift-date">Fecha</FieldLabel>
            <Input
              id="shift-date"
              type="date"
              value={date}
              max={localDateStr(new Date())}
              onChange={(e) => setDate(e.target.value)}
              required
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="shift-hours">Horas trabajadas</FieldLabel>
            <Input
              id="shift-hours"
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              placeholder="Ej: 8"
              required
              className={`${fieldClass} tabular-nums`}
            />
          </div>
        </div>

        {/* Odometro */}
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <FieldLabel>Odometro (ultimos 3 digitos)</FieldLabel>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div className="space-y-1">
              <Input
                id="shift-startKm"
                type="number"
                min="0"
                max="999"
                value={startKm}
                onChange={(e) => {
                  const val = e.target.value
                  if (val.length <= 3) setStartKm(val)
                }}
                placeholder="Inicio"
                aria-label="Odometro inicio"
                className={`${fieldClass} text-xl font-light tabular-nums text-center`}
              />
              <p className="text-[11px] text-zinc-400 text-center">Inicio</p>
            </div>
            <span className="text-zinc-300 text-lg pb-6" aria-hidden>-</span>
            <div className="space-y-1">
              <Input
                id="shift-endKm"
                type="number"
                min="0"
                max="999"
                value={endKm}
                onChange={(e) => {
                  const val = e.target.value
                  if (val.length <= 3) setEndKm(val)
                }}
                placeholder="Fin"
                aria-label="Odometro fin"
                className={`${fieldClass} text-xl font-light tabular-nums text-center`}
              />
              <p className="text-[11px] text-zinc-400 text-center">Fin</p>
            </div>
          </div>
          {kmPreview != null && (
            <p className="text-[11px] font-semibold text-emerald-600 text-center tabular-nums">
              +{kmPreview} km recorridos
            </p>
          )}
        </div>

        {/* Ingresos por app — Tabs */}
        <div className="space-y-3">
          <FieldLabel>Ingresos por app</FieldLabel>
          <Tabs value={activeApp} onValueChange={(v) => setActiveApp(v as DriverApp)} className="w-full">
            <TabsList className="w-full justify-start h-auto p-1 bg-zinc-100 rounded-xl gap-1">
              {DRIVER_APPS.map((app) => {
                const total = appTotals[app]
                return (
                  <TabsTrigger
                    key={app}
                    value={app}
                    className="flex-1 min-w-0 gap-2 rounded-lg text-zinc-500 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  >
                    <span className="truncate text-[13px] font-semibold">{DRIVER_APP_LABELS[app]}</span>
                    {total > 0 && (
                      <span className="hidden sm:inline text-[11px] font-medium tabular-nums opacity-60">{total.toFixed(0)}</span>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {DRIVER_APPS.map((app) => (
              <TabsContent key={app} value={app} className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${APP_BADGE_CLASS}`}>
                    {DRIVER_APP_LABELS[app]}
                  </span>
                  <span className="text-[11px] text-zinc-500 tabular-nums">
                    {(earnings[app].CASH + earnings[app].CARD + earnings[app].QR + bonuses[app] + (tips[app]?.CASH ?? 0) + (tips[app]?.QR ?? 0)).toFixed(0)} Bs bruto
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <AmountField id={`${app}-CASH`} label="Efectivo" value={earnings[app].CASH || ''} onChange={(v) => updateEarnings(app, 'CASH', v)} />
                  <AmountField id={`${app}-CARD`} label="Tarjeta" value={earnings[app].CARD || ''} onChange={(v) => updateEarnings(app, 'CARD', v)} />
                  <AmountField id={`${app}-QR`} label="QR" value={earnings[app].QR || ''} onChange={(v) => updateEarnings(app, 'QR', v)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-200">
                  <AmountField id={`${app}-TIP-CASH`} label="Propinas efectivo" value={tips[app]?.CASH || ''} onChange={(v) => updateTips(app, 'CASH', v)} />
                  <AmountField id={`${app}-TIP-QR`} label="Propinas QR" value={tips[app]?.QR || ''} onChange={(v) => updateTips(app, 'QR', v)} />
                  <AmountField id={`${app}-BONUS`} label="Bonos" value={bonuses[app] || ''} onChange={(v) => updateBonuses(app, v)} />
                  <AmountField id={`${app}-COMM`} label="Comision app" value={commissions[app] || ''} onChange={(v) => updateCommissions(app, v)} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Gastos */}
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <FieldLabel>Gastos del turno</FieldLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addExpense}
              className="h-8 rounded-lg text-[11px] font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            >
              <Plus className="size-3 mr-1" />
              Agregar
            </Button>
          </div>

          {expenses.length === 0 && (
            <p className="text-[11px] text-zinc-400 text-center py-3">Sin gastos registrados</p>
          )}

          <div className="space-y-3">
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

        {/* Notas */}
        <div className="space-y-2">
          <FieldLabel htmlFor="shift-notes">Notas</FieldLabel>
          <Input
            id="shift-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Lluvia, trafico, eventos..."
            className={fieldClass}
          />
        </div>

        {/* Resumen */}
        <SummaryCard totals={totals} hoursWorked={parseFloat(hoursWorked) || 0} />

        {/* Acciones */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 h-11 rounded-lg border-zinc-200 text-zinc-600 font-semibold hover:bg-zinc-50"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending || (totals.grossEarnings === 0 && totals.totalExpenses === 0)}
            className="flex-1 h-11 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold active:scale-[0.98] transition-all"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="size-4" />
                {isEditMode ? 'Guardar cambios' : 'Guardar turno'}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
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
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <label className="sr-only" htmlFor={`exp-type-${expense.type}`}>Tipo</label>
      <select
        value={expense.type}
        onChange={(e) => onChange('type', e.target.value)}
        className="h-11 rounded-xl bg-white border border-zinc-200 text-sm text-zinc-900 px-3 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-300 flex-1 min-w-0"
      >
        {EXPENSE_TYPES.map((t) => (
          <option key={t} value={t}>{EXPENSE_TYPE_LABELS[t]}</option>
        ))}
      </select>
      <Input
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        value={expense.amount || ''}
        onChange={(e) => onChange('amount', e.target.value)}
        placeholder="Monto"
        aria-label="Monto gasto"
        className={`${fieldClass} font-semibold tabular-nums sm:w-28`}
      />
      <select
        value={expense.paymentMethod}
        onChange={(e) => onChange('paymentMethod', e.target.value)}
        className="h-11 rounded-xl bg-white border border-zinc-200 text-sm text-zinc-900 px-3 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 focus:border-zinc-300 sm:w-28"
      >
        {(['CASH', 'QR'] as PaymentMethod[]).map((m) => (
          <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
        ))}
      </select>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="size-11 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 shrink-0 self-end sm:self-center"
        aria-label="Quitar gasto"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

// ─── SummaryCard ───────────────────────────────────────────────────────────────
function SummaryCard({ totals, hoursWorked }: {
  totals: ShiftMetrics
  hoursWorked: number
}) {
if (totals.grossEarnings === 0 && totals.totalExpenses === 0) return null

  return (
    <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-3 text-[13px]">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">
        <Receipt className="size-3.5" />
        Resumen
      </div>

      <div className="space-y-1.5">
        <Row label="Efectivo" value={totals.totalCash} />
        <Row label="Tarjeta" value={totals.totalCard} />
        <Row label="QR" value={totals.totalQr} />
        <Row label="Bonos" value={totals.totalBonuses} />
        <Row label="Propinas efectivo" value={totals.totalCashTips} />
        <Row label="Propinas QR" value={totals.totalQrTips} />
        <div className="border-t border-zinc-200 pt-2 mt-2">
          <Row label="Total bruto" value={totals.grossEarnings} strong />
        </div>
        <Row label="Pendiente en app (tarjeta + bonos)" value={-totals.pendingAmount} />
        <Row label="Comisiones" value={-totals.totalCommissions} />
        <Row label="Gastos" value={-totals.totalExpenses} />
        <Row label="Fondo mantenimiento 6%" value={-totals.maintenanceReserve} />
      </div>

      {totals.preMaintenanceLiquid > 0 && !totals.qualifiesForMaintenance && (
        <p className="text-[11px] leading-relaxed text-zinc-400">
          Este turno retiene {Math.round(totals.margin * 100)}% de lo bruto, as&iacute; que no se
          aparta nada al fondo de mantenimiento.
        </p>
      )}

      <div className="border-t border-zinc-200 pt-3 flex justify-between items-center gap-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">Neto liquido</span>
        <span className={`text-lg font-bold tabular-nums tracking-tight ${totals.liquidEarnings >= 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
          Bs {totals.liquidEarnings.toFixed(2)}
        </span>
      </div>

      {hoursWorked > 0 && (
        <p className="text-[11px] text-zinc-400 text-right tabular-nums">
          {totals.liquidEarnings / hoursWorked > 0
            ? `Bs ${(totals.liquidEarnings / hoursWorked).toFixed(2)}/hora`
            : `Bs 0.00/hora`}
        </p>
      )}
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  if (value === 0) return null
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-zinc-500 text-[11px]">{label}</span>
      <span className={`tabular-nums text-[13px] ${strong ? 'font-bold text-zinc-900' : 'font-semibold text-zinc-900'}`}>
        {value > 0 ? '+' : '−'}{Math.abs(value).toFixed(2)}
      </span>
    </div>
  )
}
