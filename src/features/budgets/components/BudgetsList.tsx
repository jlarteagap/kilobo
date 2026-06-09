// features/budgets/BudgetsList.tsx
"use client"

import { useState, useMemo } from "react"
import { Plus, Banknote } from "lucide-react"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"

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

import { BudgetCard }    from "./BudgetCard"
import { BudgetSummary } from "./BudgetSummary"
import { BudgetForm }    from "../BudgetForm"
import {
  useBudgets,
  useBudgetProgress,
  useArchiveBudget,
  useDeleteBudget,
} from "../hooks/useBudgets"
import { MonthlyInstallmentsCard } from "@/features/credits/components/MonthlyInstallmentsCard"
import { PayInstallmentsForm }     from "@/features/credits/components/PayInstallmentsForm"
import { useCredits, creditKeys }  from "@/features/credits/hooks/useCredits"
import { useQueries } from "@tanstack/react-query"
import type { BudgetProgress } from "@/types/budget"
import type { Credit, Installment } from "@/types/credit"

function authFetch(url: string) {
  return fetch(url, { headers: { 'Content-Type': 'application/json' } })
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────
type FilterTab = 'ALL' | 'INCOME_SOURCE' | 'FIXED_EXPENSE' | 'SAVINGS_GOAL' | 'ARCHIVED'

const FILTER_TABS: { value: FilterTab; label: string; emoji: string }[] = [
  { value: 'ALL',           label: 'Todos',     emoji: '📋' },
  { value: 'INCOME_SOURCE', label: 'Ingresos',  emoji: '💰' },
  { value: 'FIXED_EXPENSE', label: 'Fijos',     emoji: '📌' },
  { value: 'SAVINGS_GOAL',  label: 'Ahorros',   emoji: '🎯' },
  { value: 'ARCHIVED',      label: 'Archivados',emoji: '📦' },
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function BudgetsGridSkeleton() {
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
              <Skeleton className="h-3.5 w-28 rounded-full" />
              <Skeleton className="h-3   w-16 rounded-full" />
            </div>
          </div>
          <div className="space-y-1">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Dialog state ─────────────────────────────────────────────────────────────
type DialogState =
  | { mode: 'closed'  }
  | { mode: 'create'  }
  | { mode: 'edit';   progress: BudgetProgress }
  | { mode: 'pay-installment'; credit: Credit; installment: Installment }

// ─── Componente principal ─────────────────────────────────────────────────────
export function BudgetsList() {
  const { isLoading, isError }    = useBudgets()
  const progress                  = useBudgetProgress()

  const archiveBudget = useArchiveBudget()
  const deleteBudget  = useDeleteBudget()

  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' })
  const [pendingArchive, setPendingArchive ] = useState<BudgetProgress | null>(null)
  const [pendingDelete,  setPendingDelete  ] = useState<BudgetProgress | null>(null)
  const [activeFilter,   setActiveFilter   ] = useState<FilterTab>('ALL')

  // ── Créditos con cuotas del mes ──────────────────────────────────────────────
  const { data: credits = [] } = useCredits()
  const activeCredits = credits.filter(
    (c) => c.status === 'ACTIVE' && c.total_installments > c.paid_installments
  )

  const detailQueries = useQueries({
    queries: activeCredits.map((credit) => ({
      queryKey: creditKeys.detail(credit.id),
      queryFn: async (): Promise<{ credit: Credit; installments: Installment[] }> => {
        const res  = await authFetch(`/api/credits/${credit.id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Error al obtener el crédito')
        return json.data
      },
      staleTime: 1000 * 60 * 2,
    })),
  })

  const installmentsByCredit = useMemo(() => {
    const map: Record<string, Installment[]> = {}
    detailQueries.forEach((q) => {
      if (q.data) {
        map[q.data.credit.id] = q.data.installments
      }
    })
    return map
  }, [detailQueries])

  const payingCreditId = dialog.mode === 'pay-installment' ? dialog.credit.id : null
  const payingQuery    = payingCreditId ? detailQueries.find((q) => q.data?.credit.id === payingCreditId) : null
  const isPayLoading   = !!payingCreditId && (payingQuery?.isPending ?? true)

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const creditsWithMonthData = useMemo(() => {
    return activeCredits.filter((c) => {
      const insts = installmentsByCredit[c.id] ?? []
      return insts.some((i) => {
        const d = new Date(i.due_date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
    })
  }, [activeCredits, installmentsByCredit, currentMonth, currentYear])

  const getPendingThisMonth = (creditId: string): Installment[] => {
    const insts = installmentsByCredit[creditId] ?? []
    return insts.filter((i) => {
      const d = new Date(i.due_date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
  }

  // ── Filtrado ────────────────────────────────────────────────────────────────
  const filtered = progress.filter((p) => {
    if (activeFilter === 'ARCHIVED')      return !p.budget.is_active
    if (activeFilter === 'ALL')           return  p.budget.is_active
    return p.budget.type === activeFilter &&  p.budget.is_active
  })

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleArchiveConfirm = () => {
    if (!pendingArchive) return
    archiveBudget.mutate(pendingArchive.budget.id, {
      onSettled: () => setPendingArchive(null),
    })
  }

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return
    deleteBudget.mutate(pendingDelete.budget.id, {
      onSettled: () => setPendingDelete(null),
    })
  }

  const isDialogOpen = dialog.mode !== 'closed'

  // ── Conteos por tab ─────────────────────────────────────────────────────────
  const countByTab = (tab: FilterTab) => {
    if (tab === 'ARCHIVED') return progress.filter((p) => !p.budget.is_active).length
    if (tab === 'ALL')      return progress.filter((p) =>  p.budget.is_active).length
    return progress.filter((p) => p.budget.type === tab && p.budget.is_active).length
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Presupuestos
          </h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            Metas, ingresos y gastos fijos del mes
          </p>
        </div>
        <Button
          onClick={() => setDialog({ mode: 'create' })}
          className="gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </Button>
      </div>

      {/* ── Layout: Resumen (1/3) + Cards (2/3) ── */}
      {!isLoading && progress.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumen */}
          <div className="lg:col-span-1">
            <BudgetSummary />
          </div>

          {/* Cards */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
              {FILTER_TABS.map((tab) => {
                const count = countByTab(tab.value)
                if (count === 0 && tab.value !== 'ALL') return null
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveFilter(tab.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200',
                      activeFilter === tab.value
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    )}
                  >
                    <span>{tab.emoji}</span>
                    {tab.label}
                    {count > 0 && (
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                        activeFilter === tab.value
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-gray-200 text-gray-400'
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Grid de cards */}
            {isLoading ? (
              <BudgetsGridSkeleton />
            ) : isError ? (
              <div className="bg-rose-50 text-rose-500 text-sm p-4 rounded-xl">
                Error al cargar los presupuestos. Intenta nuevamente.
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="📋"
                title={activeFilter === 'ARCHIVED' ? 'No hay presupuestos archivados.' : 'No hay presupuestos en esta categoría.'}
                subtitle="Usa el botón de arriba para crear uno."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((p) => (
                  <BudgetCard
                    key={p.budget.id}
                    progress={p}
                    onEdit={(prog)    => setDialog({ mode: 'edit', progress: prog })}
                    onArchive={(prog) => setPendingArchive(prog)}
                    onDelete={(prog)  => setPendingDelete(prog)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state global */}
      {!isLoading && progress.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-gray-500 text-sm font-medium">
            No hay presupuestos creados
          </p>
          <p className="text-gray-300 text-[13px] mt-1 mb-6">
            Crea tu primer presupuesto para hacer seguimiento de tus metas
          </p>
          <Button
            onClick={() => setDialog({ mode: 'create' })}
            className="gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Crear primer presupuesto
          </Button>
        </div>
      )}

      {/* ── Cuotas del mes ── */}
      {creditsWithMonthData.length > 0 && (
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Cuotas del mes</h3>
              <p className="text-[11px] text-gray-400">Créditos institucionales con cuotas este período</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creditsWithMonthData.map((credit) => {
              const insts = installmentsByCredit[credit.id] ?? []
              const pendingThisMonth = getPendingThisMonth(credit.id)
              return (
                <MonthlyInstallmentsCard
                  key={credit.id}
                  credit={credit}
                  installments={insts}
                  pendingThisMonth={pendingThisMonth}
                  onPay={(c, inst) => setDialog({ mode: 'pay-installment', credit: c, installment: inst })}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ── Dialog crear / editar ── */}
      <Dialog
        open={isDialogOpen && dialog.mode !== 'pay-installment'}
        onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}
      >
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {dialog.mode === 'edit' ? 'Editar presupuesto' : 'Nuevo presupuesto'}
            </DialogTitle>
          </DialogHeader>
          {dialog.mode === 'create' && (
            <BudgetForm onSuccess={() => setDialog({ mode: 'closed' })} />
          )}
          {dialog.mode === 'edit' && (
            <BudgetForm
              initialData={dialog.progress.budget}
              onSuccess={() => setDialog({ mode: 'closed' })}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog pagar cuota de crédito ── */}
      <Dialog
        open={dialog.mode === 'pay-installment'}
        onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Pagar cuota
              {dialog.mode === 'pay-installment' && (
                <span className="text-gray-400 font-normal text-sm ml-1">
                  · {dialog.installment.number}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {dialog.mode === 'pay-installment' && (
            isPayLoading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-6 w-32 rounded-lg" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ) : (
              <PayInstallmentsForm
                credit={dialog.credit}
                installment={dialog.installment}
                onSuccess={() => setDialog({ mode: 'closed' })}
              />
            )
          )}
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog archivar ── */}
      <AlertDialog
        open={!!pendingArchive}
        onOpenChange={(open) => !open && setPendingArchive(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar este presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              El presupuesto{' '}
              <strong>{pendingArchive?.budget.name}</strong>{' '}
              dejará de aparecer en el seguimiento activo.
              Podrás eliminarlo desde la pestaña Archivados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
            >
              Archivar
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
            <AlertDialogTitle>¿Eliminar este presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El historial de seguimiento
              de <strong>{pendingDelete?.budget.name}</strong> se perderá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
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