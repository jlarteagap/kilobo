'use client'

import { useState } from 'react'
import { History, TrendingUp, TrendingDown, Clock, Trash2, Pencil, MessageSquareText } from 'lucide-react'
import type { DriverShift } from '@/types/driver'
import { DRIVER_APPS, DRIVER_APP_LABELS } from '@/types/driver'
import { getAppBadgeColor, hoursToDuration, parseLocalDate } from '../utils/driver-metrics.utils'
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
      <div className="rounded-[22px] border border-dashed border-border bg-card dark:bg-card p-8 text-center">
        <div className="size-12 rounded-xl bg-secondary dark:bg-muted mx-auto flex items-center justify-center text-muted-foreground mb-3">
          <History className="size-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {label ? `No hay turnos en ${label}` : 'Aun no hay turnos'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
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
              className="group relative flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card dark:bg-card border border-border hover:border-primary/20 hover:shadow-sm transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              {/* Fecha */}
              <div className="min-w-[44px] text-center shrink-0">
                <p className="text-base font-bold text-foreground leading-none tabular-nums">
                  {isValidDate ? date.getDate() : '-'}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5 capitalize">
                  {isValidDate ? date.toLocaleDateString('es-BO', { month: 'short' }).replace('.', '') : ''}
                </p>
              </div>

              {/* Horas */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground min-w-[72px]">
                <Clock className="size-3.5 shrink-0" />
                <span className="tabular-nums font-medium">{hoursToDuration(hours)}</span>
              </div>

              {/* Badges app */}
              <div className="hidden sm:flex items-center gap-1.5 flex-1 flex-wrap min-w-0">
                {DRIVER_APPS.map((app) => {
                  const total = (shift.earnings?.[app]?.CASH ?? 0) + (shift.earnings?.[app]?.CARD ?? 0) + (shift.earnings?.[app]?.QR ?? 0)
                  if (!total) return null
                  return (
                    <span key={app} className={`text-xs font-bold px-2 py-0.5 rounded-full tabular-nums border ${getAppBadgeColor(app)}`}>
                      {DRIVER_APP_LABELS[app][0]} {total.toFixed(0)}
                    </span>
                  )
                })}
                {shift.notes && (
                  <span className="text-muted-foreground" aria-label="Tiene notas">
                    <MessageSquareText className="size-3.5" />
                  </span>
                )}
              </div>

              {/* Liquido */}
              <div className="text-right ml-auto shrink-0">
                <p className="text-sm font-bold text-primary tabular-nums leading-none">
                  {liquid.toFixed(0)}
                </p>
                {pending > 0 && (
                  <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                    +{pending.toFixed(0)} pend.
                  </p>
                )}
              </div>

              {/* Tendencia */}
              {trend != null && trend !== 0 && (
                <div className={`hidden sm:flex items-center gap-1 text-xs font-bold shrink-0 ${trend > 0 ? 'text-primary' : 'text-destructive'}`}>
                  {trend > 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  <span className="tabular-nums">{Math.abs(trend).toFixed(0)}</span>
                </div>
              )}

              {/* Actions — always visible on mobile, hover-reveal on desktop */}
              <div className="flex items-center gap-1.5 shrink-0 ml-1 sm:ml-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleEdit(e, shift)}
                    className="size-9 rounded-xl bg-card dark:bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/20 shadow-sm sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                    aria-label="Editar turno"
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDeleteRequest(e, shift.id)}
                  disabled={deletingId === shift.id}
                  className="size-9 rounded-xl bg-card dark:bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 shadow-sm sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                  aria-label="Eliminar turno"
                >
                  {deletingId === shift.id ? (
                    <span className="size-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent className="rounded-[22px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar turno?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borraran las transacciones y el registro de km asociados. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="rounded-xl bg-destructive hover:bg-destructive/90">
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
