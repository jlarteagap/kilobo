import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Landmark, Plus, Trash2 } from 'lucide-react'
import { DRIVER_APPS, DRIVER_APP_LABELS } from '@/types/driver'
import type { DriverApp, DepositInput } from '@/types/driver'
import { APP_BADGE_CLASS } from '@/features/driver/utils/driver-metrics.utils'
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

  const inputClass = 'h-11 rounded-xl border-zinc-200 bg-white text-sm font-semibold tabular-nums text-zinc-900 focus-visible:ring-zinc-400/30'
  const labelClass = 'block text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500'

  return (
    <div className="rounded-[22px] border border-zinc-200 bg-white p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
            <Landmark className="size-3" />
          </div>
          <span className="text-[13px] font-semibold text-zinc-900 tracking-tight truncate">Depositos de apps</span>
          {deposits.length > 0 && (
            <span className="text-[11px] font-semibold text-zinc-400 tabular-nums shrink-0">{deposits.length}</span>
          )}
        </div>
        {!showForm && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-lg text-[11px] font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-50 shrink-0"
            onClick={() => setShowForm(true)}
          >
            <Plus className="size-3.5 mr-1.5" />
            Registrar deposito
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className={labelClass}>App</Label>
              <Select value={app} onValueChange={(v) => setApp(v as DriverApp)}>
                <SelectTrigger className="h-11 rounded-xl border-zinc-200 bg-white text-sm font-semibold text-zinc-900">
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
              <span className="text-[11px] font-medium text-zinc-500">Neto recibido: </span>
              <span className="text-[15px] font-bold text-emerald-600 tabular-nums">Bs {formatCurrency(net)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-9 px-3 rounded-lg text-[11px] font-bold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button
                className="h-9 px-4 rounded-lg text-[11px] font-bold bg-zinc-900 hover:bg-zinc-800 text-white"
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
        <div className="space-y-2">
          <div className="h-14 bg-zinc-100 rounded-xl animate-pulse" />
          <div className="h-14 bg-zinc-100 rounded-xl animate-pulse" />
        </div>
      ) : deposits.length === 0 ? (
        <p className="text-[11px] text-zinc-400 py-4 text-center">
          No hay depositos registrados para {label}.
        </p>
      ) : (
        <ul className="space-y-2">
          {deposits.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums border ${APP_BADGE_CLASS}`}>
                  {DRIVER_APP_LABELS[d.app]}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-zinc-900 tabular-nums">{formatDate(d.date)}</p>
                  {d.notes && (
                    <p className="text-[11px] text-zinc-400 truncate">{d.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-[11px] text-zinc-500 tabular-nums">Bruto <span className="text-zinc-900 font-medium">{formatCurrency(d.grossAmount)}</span></p>
                  <p className="text-[11px] text-zinc-500 tabular-nums">Comision <span className="text-zinc-900 font-medium">−{formatCurrency(d.commission)}</span></p>
                  <p className="text-[11px] font-bold text-emerald-600 tabular-nums">Neto {formatCurrency(d.netAmount)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                  aria-label="Eliminar deposito"
                  onClick={() => del.mutate(d.id)}
                  disabled={del.isPending}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Reconciliacion */}
      {reconciliation.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">Conciliacion por app</p>
          {reconciliation.map((r) => (
            <div key={r.app} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[13px] font-semibold text-zinc-900 min-w-0 truncate">{DRIVER_APP_LABELS[r.app]}</span>
              <div className="flex items-center gap-4 shrink-0 tabular-nums">
                <span className="text-[11px] text-zinc-500">
                  Depositado <strong className="text-zinc-900">{formatCurrency(r.deposited)}</strong>
                </span>
                <span className="text-[11px] text-zinc-500">
                  Pendiente <strong className="text-zinc-900">{formatCurrency(r.pending)}</strong>
                </span>
                <span className={`text-[11px] font-bold ${r.difference >= 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
                  {r.difference >= 0 ? '+' : '−'}{formatCurrency(Math.abs(r.difference))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}