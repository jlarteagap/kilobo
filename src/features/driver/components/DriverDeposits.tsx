import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Landmark, Plus, Trash2 } from 'lucide-react'
import { DRIVER_APPS, DRIVER_APP_LABELS } from '@/types/driver'
import type { DriverApp, DepositInput } from '@/types/driver'
import { useDriverDeposits, useDriverDepositsReconciliation, useCreateDriverDeposit, useDeleteDriverDeposit } from '@/features/driver/hooks/useDriverDeposits'
import type { MonthCycle } from '@/features/driver/hooks/useDriverShifts'

function todayLocalStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getAppBadgeColor(app: DriverApp): string {
  const map: Record<DriverApp, string> = {
    UBER: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700',
    YANGO: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700',
    INDRIVE: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700',
  }
  return map[app]
}

export function DriverDeposits({ cycle, label }: { cycle: MonthCycle; label: string }) {
  const { data: deposits = [], isLoading } = useDriverDeposits(cycle)
  const { data: reconciliation = [] } = useDriverDepositsReconciliation()
  const create = useCreateDriverDeposit()
  const del = useDeleteDriverDeposit()

  const [showForm, setShowForm] = useState(false)
  const [app, setApp] = useState<DriverApp>('UBER')
  const [date, setDate] = useState(todayLocalStr)
  const [grossAmount, setGrossAmount] = useState('')
  const [commission, setCommission] = useState('')
  const [notes, setNotes] = useState('')

  const gross = parseFloat(grossAmount) || 0
  const comm = parseFloat(commission) || 0
  const net = gross - comm
  const canSubmit = gross > 0 && comm >= 0 && date !== ''

  const resetForm = () => {
    setApp('UBER')
    setDate(todayLocalStr())
    setGrossAmount('')
    setCommission('')
    setNotes('')
    setShowForm(false)
  }

  const handleCreate = () => {
    if (!canSubmit) return
    const payload: DepositInput = {
      app,
      date,
      grossAmount: gross,
      commission: comm,
      notes: notes.trim() || null,
    }
    create.mutate(payload, { onSuccess: resetForm })
  }

  const inputClass = 'h-11 rounded-xl border-input bg-card text-sm font-semibold tabular-nums focus-visible:ring-primary/30'
  const labelClass = 'text-xs font-medium text-muted-foreground'

  return (
    <div className="rounded-[22px] border border-border bg-card p-5 sm:p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 rounded-lg bg-secondary dark:bg-muted flex items-center justify-center text-muted-foreground shrink-0">
            <Landmark className="size-3" />
          </div>
          <h2 className="text-sm font-bold text-foreground tracking-tight truncate">Depositos de apps</h2>
          {deposits.length > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">· {deposits.length}</span>
          )}
        </div>
        {!showForm && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl text-xs font-bold border-border"
            onClick={() => setShowForm(true)}
          >
            <Plus className="size-3.5 mr-1.5" />
            Registrar deposito
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className={labelClass}>App</Label>
              <Select value={app} onValueChange={(v) => setApp(v as DriverApp)}>
                <SelectTrigger className="h-11 rounded-xl border-input bg-card text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DRIVER_APPS.map((a) => (
                    <SelectItem key={a} value={a}>{DRIVER_APP_LABELS[a]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Fecha</Label>
              <Input
                type="date"
                value={date}
                max={todayLocalStr()}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Bruto</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={grossAmount}
                onChange={(e) => setGrossAmount(e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Comision</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Neto recibido: </span>
              <span className="font-bold text-emerald-600 tabular-nums">Bs {formatCurrency(net)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="h-9 px-3 rounded-xl text-xs font-bold" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                className="h-9 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-sm"
                disabled={!canSubmit || create.isPending}
                onClick={handleCreate}
              >
                {create.isPending ? 'Registrando...' : 'Registrar deposito'}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass}>Notas (opcional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas del deposito"
              maxLength={500}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-14 bg-secondary dark:bg-muted rounded-xl" />
          <div className="h-14 bg-secondary dark:bg-muted rounded-xl" />
        </div>
      ) : deposits.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No hay depositos registrados para {label}.
        </p>
      ) : (
        <ul className="space-y-2">
          {deposits.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full tabular-nums border ${getAppBadgeColor(d.app)}`}>
                  {DRIVER_APP_LABELS[d.app]}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground tabular-nums">{formatDate(d.date)}</p>
                  {d.notes && (
                    <p className="text-xs text-muted-foreground truncate">{d.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground tabular-nums">Bruto <span className="text-foreground">{formatCurrency(d.grossAmount)}</span></p>
                  <p className="text-xs text-destructive tabular-nums">Comision <span>−{formatCurrency(d.commission)}</span></p>
                  <p className="text-xs font-bold text-emerald-600 tabular-nums">Neto {formatCurrency(d.netAmount)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                  aria-label="Eliminar deposito"
                  onClick={() => del.mutate(d.id)}
                  disabled={del.isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Reconciliacion */}
      {reconciliation.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Conciliacion por app</p>
          {reconciliation.map((r) => (
            <div key={r.app} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-foreground min-w-0 truncate">{DRIVER_APP_LABELS[r.app]}</span>
              <div className="flex items-center gap-4 shrink-0 tabular-nums">
                <span className="text-muted-foreground">
                  Depositado <strong className="text-foreground">{formatCurrency(r.deposited)}</strong>
                </span>
                <span className="text-muted-foreground">
                  Pendiente <strong className="text-foreground">{formatCurrency(r.pending)}</strong>
                </span>
                <span className={r.difference >= 0 ? 'text-emerald-600 font-bold' : 'text-destructive font-bold'}>
                  {r.difference >= 0 ? '+' : ''}{formatCurrency(r.difference)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}