'use client'

import { useState } from 'react'
import { History, TrendingUp, TrendingDown, Clock, Trash2, Pencil, MessageSquareText } from 'lucide-react'
import type { DriverShift } from '@/types/driver'
import { DRIVER_APPS, DRIVER_APP_LABELS } from '@/types/driver'
import { getAppBadgeColor, hoursToDuration, parseLocalDate } from '../utils/driver-metrics.utils'
import { useDeleteShift } from '../hooks/useDriverShifts'
import { ShiftDetailSheet } from './ShiftDetailSheet'

interface ShiftHistoryProps {
  shifts: DriverShift[]
  onEdit?: (shift: DriverShift) => void
}

export function ShiftHistory({ shifts, onEdit }: ShiftHistoryProps) {
  const deleteShift = useDeleteShift()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [detailShift, setDetailShift] = useState<DriverShift | null>(null)

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (deletingId) return
    if (!window.confirm('¿Eliminar este turno? Se borrarán las transacciones y el registro de km asociados.')) return
    setDeletingId(id)
    deleteShift.mutate(id, {
      onSettled: () => setDeletingId(null),
    })
  }

  const handleEdit = (e: React.MouseEvent, shift: DriverShift) => {
    e.stopPropagation()
    onEdit?.(shift)
  }

  if (shifts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[rgba(0,0,0,0.12)] dark:border-neutral-800 p-8 text-center">
        <div className="size-10 rounded-xl bg-[#F2F9E3]/40 dark:bg-neutral-900 mx-auto flex items-center justify-center text-[#6E6E73]/60 mb-3">
          <History className="size-5" />
        </div>
        <p className="text-xs text-[#6E6E73] italic">Aún no hay turnos registrados</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {shifts.slice(0, 50).map((shift, index) => {
          // Null-safe: los turnos viejos pueden no tener los campos nuevos
          const liquid = shift.liquidEarnings ?? 0
          const pending = shift.pendingAmount ?? 0
          const hours = shift.hoursWorked ?? 0
          const prevLiquid = index < shifts.length - 1 ? (shifts[index + 1].liquidEarnings ?? 0) : null
          const trend = prevLiquid != null ? liquid - prevLiquid : null
          const dateStr = shift.date ?? ''
          const date = dateStr ? parseLocalDate(dateStr) : new Date(NaN)
          const isValidDate = !isNaN(date.getTime())

          return (
            <div
              key={shift.id}
              onClick={() => setDetailShift(shift)}
              className="group relative flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white dark:bg-neutral-900/40 border border-[rgba(0,0,0,0.06)] dark:border-neutral-900 hover:border-[rgba(0,0,0,0.12)] dark:hover:border-neutral-800 transition-all duration-200 hover:shadow-sm cursor-pointer"
            >
              {/* Fecha */}
              <div className="min-w-[36px] text-center shrink-0">
                <p className="text-[16px] font-bold text-foreground dark:text-neutral-100 leading-none tabular-nums">
                  {isValidDate ? date.getDate() : '—'}
                </p>
                <p className="text-[8px] uppercase tracking-wider text-[#6E6E73] font-medium mt-0.5">
                  {isValidDate ? date.toLocaleDateString('es-BO', { month: 'short' }).replace('.', '') : ''}
                </p>
              </div>

              {/* Horas */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#6E6E73] min-w-[60px]">
                <Clock className="size-3" />
                <span className="tabular-nums font-medium">{hoursToDuration(hours)}</span>
              </div>

              {/* Badges app */}
              <div className="hidden sm:flex items-center gap-1 flex-1 flex-wrap">
                {DRIVER_APPS.map((app) => {
                  const total = (shift.earnings?.[app]?.CASH ?? 0) + (shift.earnings?.[app]?.CARD ?? 0) + (shift.earnings?.[app]?.QR ?? 0)
                  if (!total) return null
                  return (
                    <span key={app} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${getAppBadgeColor(app)}`}>
                      {DRIVER_APP_LABELS[app][0]}:{total.toFixed(0)}
                    </span>
                  )
                })}
                {/* Notas indicator */}
                {shift.notes && (
                  <span className="text-[9px] text-[#6E6E73]/60 dark:text-neutral-600">
                    <MessageSquareText className="size-3" />
                  </span>
                )}
              </div>

              {/* Líquido vs Pendiente */}
              <div className="text-right ml-auto">
                <p className="text-sm font-bold text-[#4F6A35] tabular-nums leading-none">
                  {liquid.toFixed(0)}
                </p>
                {pending > 0 && (
                  <p className="text-[9px] text-[#6E6E73] tabular-nums mt-0.5">
                    +{pending.toFixed(0)} pend.
                  </p>
                )}
              </div>

              {/* Tendencia */}
              {trend != null && trend !== 0 && (
                <div className={`hidden sm:flex items-center gap-0.5 text-[10px] font-bold shrink-0 ${trend > 0 ? 'text-[#4F6A35]' : 'text-[#B5543D]'}`}>
                  {trend > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {Math.abs(trend).toFixed(0)}
                </div>
              )}

              {/* Actions */}
              <div className="absolute -top-1.5 -right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                {onEdit && (
                  <button
                    onClick={(e) => handleEdit(e, shift)}
                    className="size-7 rounded-full bg-white dark:bg-neutral-800 border border-[rgba(0,0,0,0.06)] dark:border-neutral-700 flex items-center justify-center text-[#6E6E73]/60 hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-800 shadow-sm"
                    title="Editar turno"
                  >
                    <Pencil className="size-3" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(e, shift.id)}
                  disabled={deletingId === shift.id}
                  className="size-7 rounded-full bg-white dark:bg-neutral-800 border border-[rgba(0,0,0,0.06)] dark:border-neutral-700 flex items-center justify-center text-[#6E6E73]/60 hover:text-[#B5543D] hover:border-[#D9A487] dark:hover:border-red-800 shadow-sm"
                  title="Eliminar turno"
                >
                  {deletingId === shift.id ? (
                    <span className="size-3 border-2 border-[#6E6E73]/40 border-t-[#6E6E73] rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="size-3" />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail Sheet */}
      {detailShift && (
        <ShiftDetailSheet shift={detailShift} onClose={() => setDetailShift(null)} />
      )}
    </>
  )
}
