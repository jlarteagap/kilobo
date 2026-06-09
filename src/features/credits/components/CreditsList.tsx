"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { CreditCard } from "./CreditCard"
import { CreditForm } from "../CreditForm"
import { CreditDetail } from "../CreditDetail"
import { PayInstallmentsForm } from "./PayInstallmentsForm"
import { useCancelCredit, useDeleteCredit, useCreditDetail } from "@/features/credits/hooks/useCredits"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import type { Credit } from "@/types/credit"

type FilterTab = 'ALL' | 'ACTIVE' | 'PAID' | 'CANCELLED'

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'ALL',       label: 'Todas'      },
  { value: 'ACTIVE',    label: 'Activos'    },
  { value: 'PAID',      label: 'Pagados'    },
  { value: 'CANCELLED', label: 'Cancelados' },
]

function CreditsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 space-y-4 shadow-card">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24 rounded-full" />
              <Skeleton className="h-3 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

function CreditsSummary({ credits }: { credits: Credit[] }) {
  const active = credits.filter((c) => c.status === 'ACTIVE')
  const totalBalance = active.reduce((sum, c) => sum + c.current_balance, 0)
  const totalPendingInstallments = active.reduce(
    (sum, c) => sum + (c.total_installments - c.paid_installments),
    0
  )
  const currency = active[0]?.currency ?? 'BOB'

  const items = [
    {
      label: 'Créditos activos',
      value: `${active.length}`,
      bg: 'bg-emerald-50',
      emoji: '🏦',
    },
    {
      label: 'Cuotas pendientes',
      value: `${totalPendingInstallments}`,
      bg: 'bg-amber-50',
      emoji: '📅',
    },
    {
      label: 'Saldo total',
      value: formatCurrency(totalBalance, currency),
      bg: 'bg-gray-50',
      emoji: '💰',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map(({ label, value, bg, emoji }) => (
        <div
          key={label}
          className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-card"
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-base', bg)}>
            {emoji}
          </div>
          <div>
            <p className="text-[11px] text-gray-400">{label}</p>
            <p className="text-sm font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

interface CreditsListProps {
  credits: Credit[]
  isLoading?: boolean
  compact?: boolean
}

type DialogState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'detail'; credit: Credit }
  | { mode: 'pay'; credit: Credit }

export function CreditsList({
  credits,
  isLoading = false,
  compact = false,
}: CreditsListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL')
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' })
  const [pendingCancel, setPendingCancel] = useState<Credit | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Credit | null>(null)

  const cancelCredit = useCancelCredit()
  const deleteCredit = useDeleteCredit()

  const detailId = dialog.mode === 'detail' || dialog.mode === 'pay' ? dialog.credit.id : ''
  const { data: detail, isLoading: detailLoading } = useCreditDetail(detailId)

  const filtered = credits.filter((c) => {
    if (activeFilter === 'ALL') return true
    return c.status === activeFilter
  })

  const handleCancelConfirm = () => {
    if (!pendingCancel) return
    cancelCredit.mutate(pendingCancel.id, {
      onSettled: () => setPendingCancel(null),
    })
  }

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return
    deleteCredit.mutate(pendingDelete.id, {
      onSettled: () => setPendingDelete(null),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!compact && (
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              Deudas institucionales
            </h2>
            <p className="text-[13px] text-gray-400 mt-0.5">
              Créditos bancarios, vehiculares, tarjetas y más
            </p>
          </div>
          <Button
            onClick={() => setDialog({ mode: 'create' })}
            className="gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Nueva
          </Button>
        </div>
      )}

      {/* Summary */}
      {!isLoading && credits.length > 0 && <CreditsSummary credits={credits} />}

      {/* Filter tabs */}
      {!isLoading && credits.length > 0 && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveFilter(tab.value)}
              className={cn(
                'text-xs font-medium rounded-lg transition-all duration-200 px-3 py-1.5',
                activeFilter === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <CreditsGridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🏦"
          title={
            activeFilter === 'ALL'
              ? 'No hay créditos institucionales registrados'
              : 'No hay créditos en esta categoría'
          }
          subtitle="Usa el botón de arriba para registrar uno."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((credit) => (
            <CreditCard
              key={credit.id}
              credit={credit}
              onDetail={(c) => setDialog({ mode: 'detail', credit: c })}
              onPay={(c) => setDialog({ mode: 'pay', credit: c })}
              onCancel={(c) => setPendingCancel(c)}
              onDelete={(c) => setPendingDelete(c)}
            />
          ))}
        </div>
      )}

      {/* Dialog: create */}
      <Dialog
        open={dialog.mode === 'create'}
        onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}
      >
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Nuevo crédito institucional
            </DialogTitle>
          </DialogHeader>
          {dialog.mode === 'create' && (
            <CreditForm onSuccess={() => setDialog({ mode: 'closed' })} />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: detail */}
      <Dialog
        open={dialog.mode === 'detail'}
        onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}
      >
        <DialogContent className="sm:max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {dialog.mode === 'detail' && dialog.credit.institution}
            </DialogTitle>
          </DialogHeader>
          {dialog.mode === 'detail' && (
            detailLoading ? (
              <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            ) : (
              <CreditDetail
                credit={detail?.credit ?? dialog.credit}
                installments={detail?.installments ?? []}
                onClose={() => setDialog({ mode: 'closed' })}
              />
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: pay */}
      <Dialog
        open={dialog.mode === 'pay'}
        onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Pagar cuota
            </DialogTitle>
          </DialogHeader>
          {dialog.mode === 'pay' && (
            detailLoading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-6 w-32 rounded-lg" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ) : (
              (() => {
                const pending = (detail?.installments ?? [])
                  .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
                  .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                return (
                  <PayInstallmentsForm
                    credit={detail?.credit ?? dialog.credit}
                    installment={pending[0] ?? (detail?.installments ?? [])[0]}
                    onSuccess={() => setDialog({ mode: 'closed' })}
                  />
                )
              })()
            )
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog: cancel */}
      <AlertDialog
        open={!!pendingCancel}
        onOpenChange={(open) => !open && setPendingCancel(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar este crédito?</AlertDialogTitle>
            <AlertDialogDescription>
              Se cancelarán todas las cuotas pendientes.
              {pendingCancel && (
                <span className="block mt-1">
                  Saldo pendiente:{' '}
                  <strong>
                    {formatCurrency(pendingCancel.current_balance, pendingCancel.currency)}
                  </strong>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
            >
              Cancelar crédito
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: delete */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este crédito?</AlertDialogTitle>
            <AlertDialogDescription>
              Solo puedes eliminar créditos pagados o cancelados.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
