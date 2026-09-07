'use client'

import { useState, useMemo } from 'react'
import { Save, X, Receipt, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { DriverApp, PaymentMethod, ExpenseType, DriverExpense, DriverShift, ShiftInput } from '@/types/driver'
import { DRIVER_APPS, DRIVER_APP_LABELS, PAYMENT_METHOD_LABELS, EXPENSE_TYPE_LABELS, EXPENSE_TYPES } from '@/types/driver'
import { isoToLocalDateStr, getAppBadgeColor } from '../utils/driver-metrics.utils'

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

  const [activeApp, setActiveApp] = useState<DriverApp>(DRIVER_APPS[0])
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

  const kmPreview = useMemo(() => {
    if (!startKm || !endKm) return null
    const s = parseInt(startKm, 10)
    const e = parseInt(endKm, 10)
    if (isNaN(s) || isNaN(e)) return null
    return e >= s ? e - s : 1000 + e - s
  }, [startKm, endKm])

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

  const appTotals = useMemo(() => {
    const map: Record<DriverApp, number> = { UBER: 0, YANGO: 0, INDRIVE: 0 }
    for (const app of DRIVER_APPS) {
      map[app] = earnings[app].CASH + earnings[app].CARD + earnings[app].QR + bonuses[app]
    }
    return map
  }, [earnings, bonuses])

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
    <div className="rounded-[22px] bg-card dark:bg-card border border-border p-4 sm:p-6 space-y-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            <Receipt className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground tracking-tight leading-none">
              {isEditMode ? 'Editar turno' : 'Registrar turno'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Al final del dia</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="size-9 rounded-xl text-muted-foreground shrink-0">
          <X className="size-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fecha + Horas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shift-date" className="text-xs font-semibold text-foreground">Fecha</Label>
            <Input
              id="shift-date"
              type="date"
              value={date}
              max={localDateStr(new Date())}
              onChange={(e) => setDate(e.target.value)}
              required
              className="h-11 bg-card dark:bg-card border-input rounded-xl text-sm font-medium focus-visible:ring-primary/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shift-hours" className="text-xs font-semibold text-foreground">Horas trabajadas</Label>
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
              className="h-11 bg-card dark:bg-card border-input rounded-xl text-sm font-medium tabular-nums focus-visible:ring-primary/30"
            />
          </div>
        </div>

        {/* Odometro */}
        <div className="space-y-3 rounded-xl border border-border bg-card-soft/60 dark:bg-muted/40 p-4">
          <Label className="text-xs font-semibold text-foreground">Odometro (ultimos 3 digitos)</Label>
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
                className="h-11 bg-card dark:bg-card border-input rounded-xl text-xl font-light tabular-nums text-center focus-visible:ring-primary/30"
              />
              <p className="text-xs text-muted-foreground text-center">Inicio</p>
            </div>
            <span className="text-muted-foreground/60 text-lg pb-6" aria-hidden>-</span>
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
                className="h-11 bg-card dark:bg-card border-input rounded-xl text-xl font-light tabular-nums text-center focus-visible:ring-primary/30"
              />
              <p className="text-xs text-muted-foreground text-center">Fin</p>
            </div>
          </div>
          {kmPreview != null && (
            <p className="text-xs text-primary font-semibold text-center">
              +{kmPreview} km recorridos
            </p>
          )}
        </div>

        {/* Ingresos por app — Tabs */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-foreground">Ingresos por app</Label>
          <Tabs value={activeApp} onValueChange={(v) => setActiveApp(v as DriverApp)} className="w-full">
            <TabsList className="w-full justify-start h-auto p-1 bg-muted dark:bg-muted rounded-xl gap-1">
              {DRIVER_APPS.map((app) => {
                const total = appTotals[app]
                return (
                  <TabsTrigger
                    key={app}
                    value={app}
                    className="flex-1 min-w-0 gap-2 rounded-lg data-[state=active]:bg-card dark:data-[state=active]:bg-card"
                  >
                    <span className={`size-2 rounded-full shrink-0 ${getAppBadgeColor(app).includes('uber') ? 'bg-driver-uber-fg' : getAppBadgeColor(app).includes('yango') ? 'bg-driver-yango-fg' : 'bg-driver-indrive-fg'}`} aria-hidden />
                    <span className="truncate text-xs font-bold">{DRIVER_APP_LABELS[app]}</span>
                    {total > 0 && (
                      <span className="hidden sm:inline text-[11px] font-medium tabular-nums opacity-70">{total.toFixed(0)}</span>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {DRIVER_APPS.map((app) => (
              <TabsContent key={app} value={app} className="mt-3 space-y-3 rounded-xl border border-border bg-card dark:bg-card p-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getAppBadgeColor(app)}`}>
                    {DRIVER_APP_LABELS[app]}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {(earnings[app].CASH + earnings[app].CARD + earnings[app].QR + bonuses[app]).toFixed(0)} Bs bruto
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`${app}-CASH`} className="text-xs font-medium text-muted-foreground">Efectivo</Label>
                    <Input
                      id={`${app}-CASH`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={earnings[app].CASH || ''}
                      onChange={(e) => updateEarnings(app, 'CASH', e.target.value)}
                      placeholder="0.00"
                      className="h-11 rounded-xl border-input bg-card dark:bg-card text-sm font-semibold tabular-nums focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${app}-CARD`} className="text-xs font-medium text-muted-foreground">Tarjeta</Label>
                    <Input
                      id={`${app}-CARD`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={earnings[app].CARD || ''}
                      onChange={(e) => updateEarnings(app, 'CARD', e.target.value)}
                      placeholder="0.00"
                      className="h-11 rounded-xl border-input bg-card dark:bg-card text-sm font-semibold tabular-nums focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${app}-QR`} className="text-xs font-medium text-muted-foreground">QR</Label>
                    <Input
                      id={`${app}-QR`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={earnings[app].QR || ''}
                      onChange={(e) => updateEarnings(app, 'QR', e.target.value)}
                      placeholder="0.00"
                      className="h-11 rounded-xl border-input bg-card dark:bg-card text-sm font-semibold tabular-nums focus-visible:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border mt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`${app}-BONUS`} className="text-xs font-medium text-muted-foreground">Bonos</Label>
                    <Input
                      id={`${app}-BONUS`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={bonuses[app] || ''}
                      onChange={(e) => updateBonuses(app, e.target.value)}
                      placeholder="0.00"
                      className="h-11 rounded-xl border-input bg-card dark:bg-card text-sm font-semibold tabular-nums focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${app}-COMM`} className="text-xs font-medium text-muted-foreground">Comision app</Label>
                    <Input
                      id={`${app}-COMM`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={commissions[app] || ''}
                      onChange={(e) => updateCommissions(app, e.target.value)}
                      placeholder="0.00"
                      className="h-11 rounded-xl border-input bg-card dark:bg-card text-sm font-semibold tabular-nums focus-visible:ring-primary/30"
                    />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Gastos */}
        <div className="space-y-3 rounded-xl border border-border bg-card dark:bg-card p-4">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-xs font-semibold text-foreground">Gastos del turno</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addExpense}
              className="h-8 rounded-xl text-xs font-bold border-border"
            >
              <Plus className="size-3 mr-1" />
              Agregar
            </Button>
          </div>

          {expenses.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">Sin gastos registrados</p>
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
          <Label htmlFor="shift-notes" className="text-xs font-semibold text-foreground">Notas</Label>
          <Input
            id="shift-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Lluvia, trafico, eventos..."
            className="h-11 bg-card dark:bg-card border-input rounded-xl text-sm focus-visible:ring-primary/30"
          />
        </div>

        {/* Resumen */}
        <SummaryCard totals={totals} hoursWorked={parseFloat(hoursWorked) || 0} />

        {/* Acciones */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}
            className="flex-1 h-11 rounded-xl border-border text-muted-foreground font-semibold">
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending || (totals.gross === 0 && totals.totalExpenses === 0)}
            className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm active:scale-[0.98] transition-all">
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
        className="h-11 rounded-xl bg-card dark:bg-card border border-input text-sm font-medium px-3 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary flex-1 min-w-0"
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
        className="h-11 bg-card dark:bg-card border-input rounded-xl text-sm font-semibold tabular-nums sm:w-28 focus-visible:ring-primary/30"
      />
      <select
        value={expense.paymentMethod}
        onChange={(e) => onChange('paymentMethod', e.target.value)}
        className="h-11 rounded-xl bg-card dark:bg-card border border-input text-sm font-medium px-3 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary sm:w-28"
      >
        {(['CASH', 'QR'] as PaymentMethod[]).map((m) => (
          <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
        ))}
      </select>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove}
        className="size-11 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-center">
        <Trash2 className="size-4" />
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
    <div className="rounded-xl bg-secondary/60 dark:bg-muted/60 border border-border p-4 space-y-3 text-[13px]">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Receipt className="size-3.5" />
        Resumen
      </div>

      <div className="space-y-1.5">
        <Row label="Efectivo" value={totals.totalCash} color="text-primary" />
        <Row label="Tarjeta" value={totals.totalCard} color="text-driver-uber-fg" />
        <Row label="QR" value={totals.totalQr} color="text-driver-indrive-fg" />
        <Row label="Bonos" value={totals.totalBonuses} color="text-amber-600 dark:text-amber-400" />
        <div className="border-t border-border pt-2 mt-2">
          <Row label="Total bruto" value={totals.gross} color="text-foreground font-bold" />
        </div>
        <Row label="Pendiente en app (tarjeta + bonos)" value={-totals.pending} color="text-muted-foreground" />
        <Row label="Comisiones" value={-totals.totalCommissions} color="text-destructive" />
        <Row label="Gastos" value={-totals.totalExpenses} color="text-destructive" />
      </div>

      <div className="border-t-2 border-border pt-3 flex justify-between items-center gap-4">
        <span className="text-xs font-bold text-muted-foreground">Neto liquido</span>
        <span className={`text-base font-bold tabular-nums ${totals.liquid >= 0 ? 'text-primary' : 'text-destructive'}`}>
          Bs {totals.liquid.toFixed(2)}
        </span>
      </div>

      {hoursWorked > 0 && (
        <p className="text-xs text-muted-foreground text-right tabular-nums">
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
    <div className="flex justify-between items-center gap-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`tabular-nums font-semibold text-sm ${color}`}>
        {value > 0 ? '+' : ''}{value.toFixed(2)}
      </span>
    </div>
  )
}
