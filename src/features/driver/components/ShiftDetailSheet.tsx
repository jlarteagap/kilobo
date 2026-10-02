'use client'

import { useEffect } from 'react'
import { X, Clock, Fuel } from 'lucide-react'
import type { DriverShift } from '@/types/driver'
import { DRIVER_APPS, DRIVER_APP_LABELS, PAYMENT_METHOD_LABELS, EXPENSE_TYPE_LABELS } from '@/types/driver'
import { formatBs, hoursToDuration, APP_BADGE_CLASS, parseLocalDate } from '../utils/driver-metrics.utils'
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
        className="fixed inset-0 bg-zinc-900/25 z-40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del turno"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[22px] bg-white border-t border-zinc-200"
        style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.10)' }}
      >
        <div className="max-w-lg mx-auto p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h3 className="text-[15px] font-semibold text-zinc-900 tracking-tight capitalize">
                {isValidDate
                  ? date.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Fecha no disponible'}
              </h3>
              <p className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" />
                {hoursToDuration(shift.hoursWorked ?? 0)} trabajadas
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 shrink-0"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </Button>
          </div>

          {(shift.startKm != null || shift.totalKm != null) && (
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
              <Fuel className="size-4 shrink-0 text-zinc-400" />
              <span className="tabular-nums font-medium text-zinc-900">
                {shift.startKm != null ? String(shift.startKm).padStart(3, '0') : '???'}
                {' - '}
                {shift.endKm != null ? String(shift.endKm).padStart(3, '0') : '???'}
              </span>
              {shift.totalKm != null && (
                <span className="font-semibold text-emerald-600 ml-auto tabular-nums">+{shift.totalKm} km</span>
              )}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">Ingresos</p>
            {DRIVER_APPS.map((app) => {
              const e = shift.earnings?.[app]
              const bonuses = shift.bonuses?.[app] ?? 0
              const tips = shift.tips?.[app]
              const tipsTotal = (tips?.CASH ?? 0) + (tips?.QR ?? 0)
              const commissions = shift.commissions?.[app] ?? 0
              const total = (e?.CASH ?? 0) + (e?.CARD ?? 0) + (e?.QR ?? 0) + tipsTotal
              if (total === 0 && !bonuses && !commissions) return null
              return (
                <div key={app} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 border ${APP_BADGE_CLASS}`}>
                      {DRIVER_APP_LABELS[app]}
                    </span>
                    <span className="text-[15px] font-bold tabular-nums text-zinc-900">{formatBs(total)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                    {e?.CASH ? <span>Efectivo: <strong className="tabular-nums text-zinc-900">{e.CASH.toFixed(2)}</strong></span> : null}
                    {e?.CARD ? <span>Tarjeta: <strong className="tabular-nums text-zinc-900">{e.CARD.toFixed(2)}</strong></span> : null}
                    {e?.QR ? <span>QR: <strong className="tabular-nums text-zinc-900">{e.QR.toFixed(2)}</strong></span> : null}
                    {bonuses ? <span>Bonos: <strong className="tabular-nums text-zinc-900">+{bonuses.toFixed(2)}</strong></span> : null}
                    {tipsTotal ? <span>Propinas: <strong className="tabular-nums text-zinc-900">+{tipsTotal.toFixed(2)}</strong> <span className="font-normal">(Ef {+(tips?.CASH ?? 0).toFixed(2)} · QR {+(tips?.QR ?? 0).toFixed(2)})</span></span> : null}
                    {commissions ? <span>Comision: <strong className="tabular-nums text-zinc-900">−{commissions.toFixed(2)}</strong></span> : null}
                  </div>
                </div>
              )
            })}
          </div>

          {shift.expenses && shift.expenses.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">Gastos</p>
              {shift.expenses.map((exp, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] bg-zinc-50 rounded-xl px-3 py-2.5 border border-zinc-200">
                  <span className="text-zinc-500">
                    {EXPENSE_TYPE_LABELS[exp.type]}
                    {' · '}
                    {PAYMENT_METHOD_LABELS[exp.paymentMethod]}
                  </span>
                  <span className="font-semibold text-zinc-900 tabular-nums">−{(exp.amount ?? 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {shift.notes && (
            <div className="text-[11px] text-zinc-500 italic bg-zinc-50 rounded-xl px-4 py-3 border border-zinc-200 leading-relaxed">
              &ldquo;{shift.notes}&rdquo;
            </div>
          )}

          <div className="border-t border-zinc-100 pt-4 space-y-2 text-[13px]">
            <RowDetail label="Bruto" value={shift.grossEarnings ?? 0} />
            <RowDetail label="Pendiente en app" value={-(shift.pendingAmount ?? 0)} />
            <RowDetail label="Comisiones" value={-(shift.totalCommissions ?? 0)} />
            <RowDetail label="Gastos" value={-(shift.totalExpenses ?? 0)} />
            <RowDetail label="Fondo mantenimiento (6%)" value={-(shift.maintenanceReserve ?? 0)} />
            <div className="border-t border-zinc-100 pt-3 flex justify-between items-center gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">Neto liquido</span>
              <span className={`text-xl font-bold tabular-nums tracking-tight ${(shift.liquidEarnings ?? 0) >= 0 ? 'text-emerald-600' : 'text-zinc-900'}`}>
                {formatBs(shift.liquidEarnings ?? 0)}
              </span>
            </div>
            {(shift.hoursWorked ?? 0) > 0 && (
              <p className="text-[11px] text-zinc-400 text-right tabular-nums">
                Bs {((shift.liquidEarnings ?? 0) / (shift.hoursWorked ?? 0)).toFixed(2)}/hora
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function RowDetail({ label, value }: { label: string; value: number }) {
  if (value === 0) return null
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-zinc-500 text-[11px]">{label}</span>
      <span className="tabular-nums font-semibold text-[13px] text-zinc-900">
        {value > 0 ? '+' : '−'}{Math.abs(value).toFixed(2)}
      </span>
    </div>
  )
}
