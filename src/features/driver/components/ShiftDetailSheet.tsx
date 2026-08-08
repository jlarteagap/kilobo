'use client'

import { X, Clock, Fuel, Receipt } from 'lucide-react'
import type { DriverShift } from '@/types/driver'
import { DRIVER_APPS, DRIVER_APP_LABELS, PAYMENT_METHOD_LABELS, EXPENSE_TYPE_LABELS } from '@/types/driver'
import { formatBs, hoursToDuration, getAppBadgeColor, parseLocalDate } from '../utils/driver-metrics.utils'

interface ShiftDetailSheetProps {
  shift: DriverShift
  onClose: () => void
}

export function ShiftDetailSheet({ shift, onClose }: ShiftDetailSheetProps) {
  const dateStr = shift.date ?? ''
  const date = dateStr ? parseLocalDate(dateStr) : new Date(NaN)
  const isValidDate = !isNaN(date.getTime())

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-white dark:bg-neutral-900 shadow-2xl border-t border-[rgba(0,0,0,0.06)] dark:border-neutral-800 animate-in slide-in-from-bottom duration-500">
        <div className="max-w-lg mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#4F6A35] dark:bg-white flex items-center justify-center text-white dark:text-black">
                <Receipt className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground dark:text-neutral-100">
                  {isValidDate
                    ? date.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Fecha no disponible'}
                </h3>
                <p className="text-[11px] text-[#6E6E73] flex items-center gap-1.5">
                  <Clock className="size-3" />
                  {hoursToDuration(shift.hoursWorked ?? 0)} trabajadas
                </p>
              </div>
            </div>
            <button onClick={onClose} className="size-8 rounded-lg flex items-center justify-center text-[#6E6E73] hover:text-foreground hover:bg-[#F2F9E3] dark:hover:bg-neutral-800">
              <X className="size-4" />
            </button>
          </div>

          {/* Km */}
          {(shift.startKm != null || shift.totalKm != null) && (
            <div className="flex items-center gap-2 text-[11px] text-[#6E6E73] bg-[#F2F9E3]/40 dark:bg-neutral-900/40 rounded-xl px-4 py-3">
              <Fuel className="size-3.5" />
              <span className="tabular-nums">
                {shift.startKm != null ? String(shift.startKm).padStart(3, '0') : '???'}
                {' → '}
                {shift.endKm != null ? String(shift.endKm).padStart(3, '0') : '???'}
              </span>
              {shift.totalKm != null && (
                <span className="font-semibold text-[#4F6A35]">+{shift.totalKm} km</span>
              )}
            </div>
          )}

          {/* Ingresos por app */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-[#6E6E73] font-bold">Ingresos</p>
            {DRIVER_APPS.map((app) => {
              const e = shift.earnings?.[app]
              const bonuses = shift.bonuses?.[app] ?? 0
              const commissions = shift.commissions?.[app] ?? 0
              const total = (e?.CASH ?? 0) + (e?.CARD ?? 0) + (e?.QR ?? 0)
              if (total === 0 && !bonuses && !commissions) return null
              return (
                <div key={app} className={`rounded-xl border p-3 space-y-1.5 ${getAppBadgeColor(app).replace(/text-\w+-\d+/g, '')}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{DRIVER_APP_LABELS[app]}</span>
                    <span className="text-sm font-bold tabular-nums">{formatBs(total)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#6E6E73]">
                    {e?.CASH ? <span>Efectivo: <strong className="tabular-nums">{e.CASH.toFixed(2)}</strong></span> : null}
                    {e?.CARD ? <span>Tarjeta: <strong className="tabular-nums">{e.CARD.toFixed(2)}</strong></span> : null}
                    {e?.QR ? <span>QR: <strong className="tabular-nums">{e.QR.toFixed(2)}</strong></span> : null}
                    {bonuses ? <span className="text-amber-600">Bonos: <strong className="tabular-nums">+{bonuses.toFixed(2)}</strong></span> : null}
                    {commissions ? <span className="text-[#B5543D]">Comisión: <strong className="tabular-nums">-{commissions.toFixed(2)}</strong></span> : null}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Gastos */}
          {shift.expenses && shift.expenses.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-[#6E6E73] font-bold">Gastos</p>
              {shift.expenses.map((exp, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] bg-[#FAEDE9]/30 dark:bg-rose-950/10 rounded-lg px-3 py-2">
                  <span className="text-[#6E6E73] dark:text-neutral-400">
                    {EXPENSE_TYPE_LABELS[exp.type]}
                    {' · '}
                    {PAYMENT_METHOD_LABELS[exp.paymentMethod]}
                  </span>
                  <span className="font-semibold text-[#B5543D] tabular-nums">-{(exp.amount ?? 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Notas */}
          {shift.notes && (
            <div className="text-[11px] text-[#6E6E73] italic bg-[#F2F9E3]/40 dark:bg-neutral-900/40 rounded-xl px-4 py-3">
              &ldquo;{shift.notes}&rdquo;
            </div>
          )}

          {/* Totales */}
          <div className="border-t border-[rgba(0,0,0,0.06)] dark:border-neutral-800 pt-4 space-y-1.5 text-[12px]">
            <RowDetail label="Bruto" value={shift.grossEarnings ?? 0} />
            <RowDetail label="Pendiente en app" value={-(shift.pendingAmount ?? 0)} color="text-amber-600" />
            <RowDetail label="Comisiones" value={-(shift.totalCommissions ?? 0)} color="text-[#B5543D]" />
            <RowDetail label="Gastos" value={-(shift.totalExpenses ?? 0)} color="text-[#B5543D]" />
            <div className="border-t-2 border-[rgba(0,0,0,0.16)] dark:border-neutral-600 pt-2 flex justify-between items-center">
              <span className="text-[11px] font-bold text-[#6E6E73] uppercase tracking-wide">Neto líquido</span>
              <span className={`text-base font-bold tabular-nums ${(shift.liquidEarnings ?? 0) >= 0 ? 'text-[#4F6A35]' : 'text-[#B5543D]'}`}>
                {formatBs(shift.liquidEarnings ?? 0)}
              </span>
            </div>
            {(shift.hoursWorked ?? 0) > 0 && (
              <p className="text-[10px] text-[#6E6E73] text-right">
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
    <div className="flex justify-between items-center">
      <span className="text-[#6E6E73]">{label}</span>
      <span className={`tabular-nums font-semibold ${color ?? 'text-foreground dark:text-neutral-100'}`}>
        {value > 0 ? '+' : ''}{value.toFixed(2)}
      </span>
    </div>
  )
}
