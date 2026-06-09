// features/debts/DebtsList.tsx
"use client"

import { useState } from "react"
import { Plus, Banknote } from "lucide-react"
import { cn } from "@/lib/utils"
import { SegmentedControl } from "@/components/ui/segmented-control"

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
import { Button }   from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { DebtCard }        from "./DebtCard"
import { DebtForm }        from "../DebtForm"
import { DebtPaymentForm } from "./DebtPaymentForm"
import { CreditForm }      from "@/features/credits/CreditForm"
import { CreditsList }     from "@/features/credits/components/CreditsList"
import { useCredits }      from "@/features/credits/hooks/useCredits"
import {
  useDebts,
  useDebtSummary,
  useCancelDebt,
  useDeleteDebt,
} from "../hooks/useDebts"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import type { Debt } from "@/types/debt"

// ─── Filter tabs ──────────────────────────────────────────────────────────────
type FilterTab = 'ALL' | 'GIVEN' | 'RECEIVED' | 'PAID'

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'ALL',      label: 'Todas'      },
  { value: 'GIVEN',    label: 'Presté'     },
  { value: 'RECEIVED', label: 'Me deben'   },
  { value: 'PAID',     label: 'Pagadas'    },
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DebtsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 space-y-4 shadow-card"
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24 rounded-full" />
              <Skeleton className="h-3 w-16 rounded-full"   />
            </div>
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-9 w-full rounded-xl"  />
        </div>
      ))}
    </div>
  )
}

// ─── Summary cards ────────────────────────────────────────────────────────────
function DebtsSummary() {
  const summary = useDebtSummary()

  const items = [
    {
      label:  'Por cobrar',
      value:  summary.pendingGiven,
      color:  'text-gray-900',
      bg:     'bg-orange-50',
      emoji:  '💸',
    },
    {
      label:  'Por pagar',
      value:  summary.pendingReceived,
      color:  'text-rose-500',
      bg:     'bg-blue-50',
      emoji:  '🤝',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ label, value, color, bg, emoji }) => (
        <div
          key={label}
          className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-card"
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-base', bg)}>
            {emoji}
          </div>
          <div>
            <p className="text-[11px] text-gray-400">{label}</p>
            <p className={cn('text-sm font-semibold', color)}>
              {formatCurrency(value, 'BOB')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Dialog state ─────────────────────────────────────────────────────────────
type DialogState =
  | { mode: 'closed'        }
  | { mode: 'create'        }
  | { mode: 'create-credit' }
  | { mode: 'pay';    debt: Debt }

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.12em] flex items-center gap-1.5">
      <span>{icon}</span>
      {label}
    </h2>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function DebtsList() {
  const { data: debts = [], isLoading, isError } = useDebts()
  const { data: creditsData = [], isLoading: creditsLoading } = useCredits()

  const cancelDebt = useCancelDebt()
  const deleteDebt = useDeleteDebt()

  const [dialog,            setDialog           ] = useState<DialogState>({ mode: 'closed' })
  const [pendingCancel,     setPendingCancel     ] = useState<Debt | null>(null)
  const [pendingDelete,     setPendingDelete     ] = useState<Debt | null>(null)
  const [activeFilter,      setActiveFilter      ] = useState<FilterTab>('ALL')

  // ── Filtrado ────────────────────────────────────────────────────────────────
  const filteredDebts = debts.filter((d) => {
    if (activeFilter === 'ALL')      return d.status !== 'CANCELLED'
    if (activeFilter === 'GIVEN')    return d.type   === 'GIVEN'    && d.status === 'ACTIVE'
    if (activeFilter === 'RECEIVED') return d.type   === 'RECEIVED' && d.status === 'ACTIVE'
    if (activeFilter === 'PAID')     return d.status === 'PAID'
    return true
  })

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCancelConfirm = () => {
    if (!pendingCancel) return
    cancelDebt.mutate(pendingCancel.id, {
      onSettled: () => setPendingCancel(null),
    })
  }

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return
    deleteDebt.mutate(pendingDelete.id, {
      onSettled: () => setPendingDelete(null),
    })
  }

  const hasDebts = debts.length > 0
  const hasCredits = creditsData.length > 0
  const splitMode = hasDebts && hasCredits

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Deudas y Préstamos
        </h1>
        <p className="text-[13px] text-gray-400 mt-0.5">
          Seguimiento de lo que debes y lo que te deben
        </p>
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => setDialog({ mode: 'create' })}
            className="gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Deuda
          </Button>
          <Button
            onClick={() => setDialog({ mode: 'create-credit' })}
            className="gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Banknote className="w-4 h-4" />
            Nuevo Crédito
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      {splitMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal debts — 1/3 */}
          <div className="space-y-4">
            <SectionLabel icon="👤" label="Personas" />
            {!isLoading && hasDebts && <DebtsSummary />}
            {!isLoading && hasDebts && (
              <SegmentedControl
                value={activeFilter}
                onChange={setActiveFilter}
                options={FILTER_TABS}
              />
            )}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : isError ? (
              <p className="text-rose-500 text-sm">Error al cargar las deudas.</p>
            ) : filteredDebts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                {activeFilter === 'ALL'
                  ? 'No hay deudas registradas.'
                  : 'No hay deudas en esta categoría.'
                }
              </p>
            ) : (
              <div className="space-y-3">
                {filteredDebts.map((debt) => (
                  <DebtCard
                    key={debt.id}
                    debt={debt}
                    onPay={(d) => setDialog({ mode: 'pay', debt: d })}
                    onCancel={(d) => setPendingCancel(d)}
                    onDelete={(d) => setPendingDelete(d)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Credits — 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            <SectionLabel icon="🏦" label="Instituciones" />
            <CreditsList
              credits={creditsData}
              isLoading={creditsLoading}
              compact
            />
          </div>
        </div>
      ) : hasDebts ? (
        <>
          {!isLoading && hasDebts && <DebtsSummary />}
          {!isLoading && hasDebts && (
            <SegmentedControl
              value={activeFilter}
              onChange={setActiveFilter}
              options={FILTER_TABS}
            />
          )}
          {isLoading ? (
            <DebtsGridSkeleton />
          ) : isError ? (
            <div className="bg-rose-50 text-rose-500 text-sm p-4 rounded-xl">
              Error al cargar las deudas. Intenta nuevamente.
            </div>
          ) : filteredDebts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🤝</p>
              <p className="text-gray-400 text-sm">
                {activeFilter === 'ALL'
                  ? 'No hay deudas registradas.'
                  : 'No hay deudas en esta categoría.'
                }
              </p>
              <p className="text-gray-300 text-[13px] mt-1">
                Usa los botones de arriba para registrar una.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDebts.map((debt) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  onPay={(d) => setDialog({ mode: 'pay', debt: d })}
                  onCancel={(d) => setPendingCancel(d)}
                  onDelete={(d) => setPendingDelete(d)}
                />
              ))}
            </div>
          )}
        </>
      ) : hasCredits ? (
        <div className="space-y-4">
          <SectionLabel icon="🏦" label="Instituciones" />
          <CreditsList
            credits={creditsData}
            isLoading={creditsLoading}
            compact
          />
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🤝</p>
          <p className="text-gray-400 text-sm">
            No hay deudas registradas.
          </p>
          <p className="text-gray-300 text-[13px] mt-1">
            Usa los botones de arriba para registrar una.
          </p>
        </div>
      )}

      {/* ── Dialog crear / pagar (personas) ── */}
      <Dialog
        open={dialog.mode === 'create' || dialog.mode === 'pay'}
        onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {dialog.mode === 'pay' ? 'Registrar pago' : 'Nueva deuda'}
            </DialogTitle>
          </DialogHeader>

          {dialog.mode === 'create' && (
            <DebtForm onSuccess={() => setDialog({ mode: 'closed' })} />
          )}
          {dialog.mode === 'pay' && (
            <DebtPaymentForm
              debt={dialog.debt}
              onSuccess={() => setDialog({ mode: 'closed' })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog crear (instituciones) ── */}
      <Dialog
        open={dialog.mode === 'create-credit'}
        onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}
      >
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Nuevo crédito institucional
            </DialogTitle>
          </DialogHeader>
          <CreditForm onSuccess={() => setDialog({ mode: 'closed' })} />
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog cancelar ── */}
      <AlertDialog
        open={!!pendingCancel}
        onOpenChange={(open) => !open && setPendingCancel(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta deuda?</AlertDialogTitle>
            <AlertDialogDescription>
              Se revertirá el balance pendiente de{' '}
              <strong>
                {pendingCancel
                  ? formatCurrency(
                      pendingCancel.amount - pendingCancel.paid_amount,
                      pendingCancel.currency
                    )
                  : ''}
              </strong>{' '}
              a la cuenta original.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
            >
              Cancelar deuda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── AlertDialog eliminar ── */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta deuda?</AlertDialogTitle>
            <AlertDialogDescription>
              Solo puedes eliminar deudas pagadas o canceladas.
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