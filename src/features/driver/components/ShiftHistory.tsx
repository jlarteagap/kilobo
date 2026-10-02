'use client'

import { useState } from 'react'
import { History, TrendingUp, TrendingDown, Clock, Trash2, Pencil, MessageSquareText } from 'lucide-react'
import type { DriverShift } from '@/types/driver'
import { DRIVER_APPS, DRIVER_APP_LABELS } from '@/types/driver'
import { APP_BADGE_CLASS, hoursToDuration, parseLocalDate } from '../utils/driver-metrics.utils'
import { useDeleteShift } from '../hooks/useDriverShifts'
import { ShiftDetailSheet } from './ShiftDetailSheet'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { MonthCycle } from '../hooks/useDriverShifts'

interface ShiftHistoryProps {
  shifts: DriverShift[]
  onEdit?: (shift: DriverShift) => void
  cycle?: MonthCycle
  label?: string
}

export function ShiftHistory({ shifts, onEdit, cycle, label }: ShiftHistoryProps) {
  const deleteShift = useDeleteShift()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [detailShift, setDetailShift] = useState<DriverShift | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleDeleteRequest = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setConfirmId(id)
  }

  const handleConfirmDelete = () => {
    if (!confirmId || deletingId) return
    setDeletingId(confirmId)
    const id = confirmId
    setConfirmId(null)
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
      <div className="rounded-[22px] border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center">
        <div className="size-11 rounded-xl bg-zinc-100 mx-auto flex items-center justify-center text-zinc-400 mb-3">
          <History className="size-5" />
        </div>
        <p className="text-[13px] font-semibold text-zinc-900">
          {label ? `No hay turnos en ${label}` : 'Aun no hay turnos'}
        </p>
        <p className="text-[11px] text-zinc-500 mt-1 max-w-[30ch] mx-auto leading-relaxed">
          {label ? 'Prueba otro ciclo o registra un turno en este mes.' : 'Registra tu primer turno para ver tu historial y tendencia.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {shifts.slice(0, 50).map((shift, index) => {
          const liquid = shift.liquidEarnings ?? 0
          const pending = shift.pendingAmount ?? 0
          const hours = shift.hoursWorked ?? 0
          const maintenance = shift.maintenanceReserve ?? 0
          const prevLiquid = index < shifts.length - 1 ? (shifts[index + 1].liquidEarnings ?? 0) : null
          const trend = prevLiquid != null ? liquid - prevLiquid : null
          const dateStr = shift.date ?? ''
          const date = dateStr ? parseLocalDate(dateStr) : new Date(NaN)
          const isValidDate = !isNaN(date.getTime())

          return (
            <div
              key={shift.id}
              onClick={() => setDetailShift(shift)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailShift(shift) } }}
              className="group relative flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/30"
            >
              {/* Fecha */}
              <div className="min-w-[44px] text-center shrink-0">
                <p className="text-base font-bold text-zinc-900 leading-none tabular-nums">
                  {isValidDate ? date.getDate() : '-'}
                </p>
                <p className="text-[11px] font-medium text-zinc-400 mt-0.5 capitalize">
                  {isValidDate ? date.toLocaleDateString('es-BO', { month: 'short' }).replace('.', '') : ''}
                </p>
              </div>

              {/* Horas */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400 min-w-[72px]">
                <Clock className="size-3.5 shrink-0" />
                <span className="tabular-nums font-medium">{hoursToDuration(hours)}</span>
              </div>

              {/* Badges app */}
              <div className="hidden sm:flex items-center gap-1.5 flex-1 flex-wrap min-w-0">
                {DRIVER_APPS.map((app) => {
                  const total = (shift.earnings?.[app]?.CASH ?? 0) + (shift.earnings?.[app]?.CARD ?? 0) + (shift.earnings?.[app]?.QR ?? 0) + (shift.tips?.[app]?.CASH ?? 0) + (shift.tips?.[app]?.QR ?? 0)
                  if (!total) return null
                  return (
                    <span key={app} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums border ${APP_BADGE_CLASS}`}>
                      {DRIVER_APP_LABELS[app][0]} {total.toFixed(0)}
                    </span>
                  )
                })}
                {shift.notes && (
                  <span className="text-zinc-300" aria-label="Tiene notas">
                    <MessageSquareText className="size-3.5" />
                  </span>
                )}
              </div>

              {/* Fondo de mantenimiento */}
              {maintenance > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums border border-zinc-200 bg-zinc-100 text-zinc-600" title="Ahorro para mantenimiento (6% del neto)">
                  Fondo {maintenance.toFixed(0)}
                </span>
              )}

              {/* Liquido */}
              <div className="text-right ml-auto shrink-0">
                <p className="text-[15px] font-bold text-emerald-600 tabular-nums leading-none">
                  {liquid.toFixed(0)}
                </p>
                {pending > 0 && (
                  <p className="text-[11px] text-zinc-400 tabular-nums mt-0.5">
                    +{pending.toFixed(0)} pend.
                  </p>
                )}
              </div>

              {/* Tendencia */}
              {trend != null && trend !== 0 && (
                <div className={`hidden sm:flex items-center gap-1 text-[11px] font-semibold shrink-0 ${trend > 0 ? 'text-emerald-600' : 'text-zinc-400'}`}>
                  {trend > 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  <span className="tabular-nums">{Math.abs(trend).toFixed(0)}</span>
                </div>
              )}

              {/* Actions — always visible on mobile, hover-reveal on desktop */}
              <div className="flex items-center gap-1 shrink-0 ml-1 sm:ml-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleEdit(e, shift)}
                    className="size-8 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                    aria-label="Editar turno"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDeleteRequest(e, shift.id)}
                  disabled={deletingId === shift.id}
                  className="size-8 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                  aria-label="Eliminar turno"
                >
                  {deletingId === shift.id ? (
                    <span className="size-3.5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent className="rounded-[22px] border border-zinc-200 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-zinc-900 tracking-tight">Eliminar turno?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-zinc-500 leading-relaxed">
              Se borraran las transacciones y el registro de km asociados. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg border-zinc-200 text-zinc-700 hover:bg-zinc-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {detailShift && (
        <ShiftDetailSheet shift={detailShift} onClose={() => setDetailShift(null)} />
      )}
    </>
  )
}
