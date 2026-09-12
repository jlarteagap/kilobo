'use client'

import { useEffect } from 'react'
import { X, Clock, Fuel, Receipt } from 'lucide-react'
import type { DriverShift } from '@/types/driver'
import { DRIVER_APPS, DRIVER_APP_LABELS, PAYMENT_METHOD_LABELS, EXPENSE_TYPE_LABELS } from '@/types/driver'
import { formatBs, hoursToDuration, getAppBadgeColor, parseLocalDate } from '../utils/driver-metrics.utils'
import { Button } from '@/components/ui/button'

interface ShiftDetailSheetProps {
  shift: DriverShift
  onClose: () => void
}

export function ShiftDetailSheet({ shift, onClose }: ShiftDetailSheetProps) {
  const dateStr = shift.date ?? ''
  const date = dateStr ? parseLocalDate(dateStr) : new Date(NaN)
  const isValidDate = !isNaN(date.getTime())

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEsc)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del turno"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[22px] bg-card dark:bg-card shadow-2xl border-t border-border animate-in slide-in-from-bottom duration-300"
      >
        <div className="max-w-lg mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                <Receipt className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground tracking-tight truncate">
                  {isValidDate
                    ? date.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Fecha no disponible'}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 shrink-0" />
                  {hoursToDuration(shift.hoursWorked ?? 0)} trabajadas
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="size-9 rounded-xl text-muted-foreground shrink-0" aria-label="Cerrar">
              <X className="size-4" />
            </Button>
          </div>

          {(shift.startKm != null || shift.totalKm != null) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary dark:bg-muted rounded-xl px-4 py-3">
              <Fuel className="size-4 shrink-0" />
              <span className="tabular-nums font-medium">
                {shift.startKm != null ? String(shift.startKm).padStart(3, '0') : '???'}
                {' - '}
                {shift.endKm != null ? String(shift.endKm).padStart(3, '0') : '???'}
              </span>
              {shift.totalKm != null && (
                <span className="font-bold text-primary ml-auto">+{shift.totalKm} km</span>
              )}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground">Ingresos</p>
            {DRIVER_APPS.map((app) => {
              const e = shift.earnings?.[app]
              const bonuses = shift.bonuses?.[app] ?? 0
              const tips = shift.tips?.[app]
              const tipsTotal = (tips?.CASH ?? 0) + (tips?.QR ?? 0)
              const commissions = shift.commissions?.[app] ?? 0
              const total = (e?.CASH ?? 0) + (e?.CARD ?? 0) + (e?.QR ?? 0) + tipsTotal
              if (total === 0 && !bonuses && !commissions) return null
              return (
                <div key={app} className={`rounded-xl border p-4 space-y-2 ${getAppBadgeColor(app)}`}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold">{DRIVER_APP_LABELS[app]}</span>
                    <span className="text-sm font-bold tabular-nums">{formatBs(total)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {e?.CASH ? <span>Efectivo: <strong className="tabular-nums text-foreground">{e.CASH.toFixed(2)}</strong></span> : null}
                    {e?.CARD ? <span>Tarjeta: <strong className="tabular-nums text-foreground">{e.CARD.toFixed(2)}</strong></span> : null}
                    {e?.QR ? <span>QR: <strong className="tabular-nums text-foreground">{e.QR.toFixed(2)}</strong></span> : null}
                    {bonuses ? <span className="text-amber-600 dark:text-amber-400">Bonos: <strong className="tabular-nums">+{bonuses.toFixed(2)}</strong></span> : null}
                    {tipsTotal ? <span className="text-amber-600 dark:text-amber-400">Propinas: <strong className="tabular-nums">+{tipsTotal.toFixed(2)}</strong> <span className="font-normal">(Ef {+(tips?.CASH ?? 0).toFixed(2)} · QR {+(tips?.QR ?? 0).toFixed(2)})</span></span> : null}
                    {commissions ? <span className="text-destructive">Comision: <strong className="tabular-nums">-{commissions.toFixed(2)}</strong></span> : null}
                  </div>
                </div>
              )
            })}
          </div>

          {shift.expenses && shift.expenses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Gastos</p>
              {shift.expenses.map((exp, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-secondary/50 dark:bg-muted/50 rounded-xl px-3 py-2.5 border border-border">
                  <span className="text-muted-foreground">
                    {EXPENSE_TYPE_LABELS[exp.type]}
                    {' · '}
                    {PAYMENT_METHOD_LABELS[exp.paymentMethod]}
                  </span>
                  <span className="font-semibold text-destructive tabular-nums">-{(exp.amount ?? 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {shift.notes && (
            <div className="text-xs text-muted-foreground italic bg-secondary dark:bg-muted rounded-xl px-4 py-3 border border-border">
              &ldquo;{shift.notes}&rdquo;
            </div>
          )}

          <div className="border-t border-border pt-4 space-y-2 text-[13px]">
            <RowDetail label="Bruto" value={shift.grossEarnings ?? 0} />
            <RowDetail label="Pendiente en app" value={-(shift.pendingAmount ?? 0)} color="text-muted-foreground" />
            <RowDetail label="Comisiones" value={-(shift.totalCommissions ?? 0)} color="text-destructive" />
            <RowDetail label="Gastos" value={-(shift.totalExpenses ?? 0)} color="text-destructive" />
            <div className="border-t-2 border-border pt-3 flex justify-between items-center gap-4">
              <span className="text-xs font-bold text-muted-foreground">Neto liquido</span>
              <span className={`text-base font-bold tabular-nums ${(shift.liquidEarnings ?? 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatBs(shift.liquidEarnings ?? 0)}
              </span>
            </div>
            {(shift.hoursWorked ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground text-right tabular-nums">
                Bs {((shift.liquidEarnings ?? 0) / (shift.hoursWorked ?? 0)).toFixed(2)}/hora
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function RowDetail({ label, value, color }: { label: string; value: number; color?: string }) {
  if (value === 0) return null
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`tabular-nums font-semibold text-sm ${color ?? 'text-foreground'}`}>
        {value > 0 ? '+' : ''}{value.toFixed(2)}
      </span>
    </div>
  )
}
