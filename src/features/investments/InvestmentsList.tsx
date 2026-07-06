"use client"

import { useState, useMemo } from "react"
import { TrendingUp, Pencil, Trash2, Plus, Wallet, Landmark, Banknote, Bitcoin, PiggyBank } from "lucide-react"
import { cn } from "@/lib/utils"

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
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

import { useInvestments, useDeleteInvestment, useUpdateInvestment } from "./hooks/useInvestments"
import { CreateInvestmentForm } from "./CreateInvestmentForm"
import { InvestmentForm } from "./InvestmentForm"
import {
  INVESTMENT_ICON,
  INVESTMENT_COLOR,
  formatInvestmentDate,
} from "./utils/investment-display.utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { getAccountTypeDetails } from "@/features/accounts/utils/account-display.utils"

import type { Account, AccountType } from "@/types/account"
import type { Investment } from "@/types/investment"

function getAccountColors(colorClass: string) {
  if (colorClass.includes('blue')) return 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
  if (colorClass.includes('purple')) return 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400'
  if (colorClass.includes('emerald')) return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
  if (colorClass.includes('orange')) return 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
  return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
}

interface InvestmentsListProps {
  accounts: Account[]
  preselectedAccountId?: string
}

const accountIconMap: Record<AccountType, typeof Wallet> = {
  BANK:   Landmark,
  WALLET: Wallet,
  CASH:   Banknote,
  CRYPTO: Bitcoin,
  OTHER:  PiggyBank,
}

function AccountCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900/50 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function InvestmentsList({
  accounts,
  preselectedAccountId,
}: InvestmentsListProps) {
  const { data: investments = [], isLoading, isError } = useInvestments()
  const deleteInvestment = useDeleteInvestment()
  const updateInvestment = useUpdateInvestment()

  const [showCreate, setShowCreate] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const filtered = preselectedAccountId
    ? investments.filter((inv) => inv.account_id === preselectedAccountId)
    : investments

  const groupedByAccount = useMemo(() => {
    const groups: Record<string, Investment[]> = {}
    for (const inv of filtered) {
      if (!groups[inv.account_id]) groups[inv.account_id] = []
      groups[inv.account_id].push(inv)
    }
    return groups
  }, [filtered])

  const getAccount = (accountId: string) =>
    accounts.find((a) => a.id === accountId)

  const handleDeleteConfirm = () => {
    if (!pendingDeleteId) return
    deleteInvestment.mutate(pendingDeleteId, {
      onSuccess: () => setPendingDeleteId(null),
      onError: () => setPendingDeleteId(null),
    })
  }

  const totalByCurrency = filtered.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.currency] = (acc[inv.currency] ?? 0) + inv.amount
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Inversiones
          </h1>
          <div className="flex items-center gap-2 text-[12px] text-neutral-500">
            <span>{filtered.length} registros</span>
            <span className="text-neutral-300">·</span>
            {Object.entries(totalByCurrency).map(([c, a]) => (
              <span key={c} className="font-semibold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(a, c)}
              </span>
            ))}
          </div>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva Inversión
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <AccountCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-[13px] p-4 rounded-xl border border-rose-100 dark:border-rose-900/50 font-medium">
          Error al cargar inversiones.
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/20">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-neutral-300" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Sin inversiones aún</h3>
          <p className="text-[12px] text-neutral-500 mt-1 max-w-[240px]">
            Registra una inversión desde una cuenta o al crear una transacción.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByAccount).map(([accountId, accountInvestments]) => {
            const account = getAccount(accountId)
            const accountByCurrency = accountInvestments.reduce<Record<string, number>>((acc, inv) => {
              acc[inv.currency] = (acc[inv.currency] ?? 0) + inv.amount
              return acc
            }, {})
            const details = account ? getAccountTypeDetails(account.type) : null
            const AccIcon = account ? accountIconMap[account.type] : Wallet

            return (
              <div
                key={accountId}
                className="bg-white dark:bg-neutral-900/50 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden"
              >
                {/* Account header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/30">
                  {details && (
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      getAccountColors(details.color)
                    )}>
                      <AccIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {account?.name ?? 'Cuenta eliminada'}
                    </h3>
                    <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                      {details?.label ?? '—'} · Total invertido: {Object.entries(accountByCurrency).map(([c, a]) => formatCurrency(a, c)).join(' · ')}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setShowCreate(true)
                    }}
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] rounded-lg border-neutral-200 dark:border-neutral-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Inversión
                  </Button>
                </div>

                {/* Investments list */}
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800/30">
                  {accountInvestments.map((inv) => (
                    <div
                      key={inv.id}
                      className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10"
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                        INVESTMENT_COLOR.bg
                      )}>
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {inv.name}
                        </p>
                        <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {formatInvestmentDate(inv.date)}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[14px] font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {formatCurrency(inv.amount, inv.currency)}
                        </p>
                      </div>

                      <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingInvestment(inv)}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPendingDeleteId(inv.id)}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={(open) => !open && setShowCreate(false)}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-neutral-200/50 dark:border-neutral-800/50 p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              Nueva Inversión
            </DialogTitle>
          </DialogHeader>
          {showCreate && (
            <CreateInvestmentForm
              preselectedAccountId={preselectedAccountId}
              onSuccess={() => setShowCreate(false)}
              onCancel={() => setShowCreate(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingInvestment} onOpenChange={(open) => !open && setEditingInvestment(null)}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-neutral-200/50 dark:border-neutral-800/50 p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              Editar Inversión
            </DialogTitle>
          </DialogHeader>
          {editingInvestment && (
            <InvestmentForm
              accounts={accounts}
              initialData={editingInvestment}
              onSubmit={(data) => {
                updateInvestment.mutate({ id: editingInvestment.id, data }, {
                  onSuccess: () => setEditingInvestment(null)
                })
              }}
              onCancel={() => setEditingInvestment(null)}
              isPending={updateInvestment.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[2.5rem] border-neutral-200 dark:border-neutral-800 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight">
              ¿Eliminar inversión?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500 dark:text-neutral-400 text-[13px] font-medium leading-relaxed">
              El monto invertido será devuelto al saldo de la cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl border-neutral-200/50 px-6 font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 font-bold"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function InvestmentsWidget({
  investments,
  accounts,
  onShowCreate,
}: {
  investments: Investment[]
  accounts: Account[]
  onShowCreate: () => void
}) {
  const Icon = INVESTMENT_ICON
  const totalByCurrency = investments.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.currency] = (acc[inv.currency] ?? 0) + inv.amount
    return acc
  }, {})

  if (investments.length === 0) {
    return (
      <div
        className="bg-card rounded-3xl p-6 border border-border/40 cursor-pointer hover:border-indigo-200/50 transition-colors"
        onClick={onShowCreate}
        style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.02)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
            <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">
              Inversiones
            </h3>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              Sin inversiones registradas
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="bg-card rounded-3xl p-6 border border-border/40"
      style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.02)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
            <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">
              Inversiones
            </h3>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              {investments.length} registro{investments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-indigo-500 cursor-pointer hover:text-indigo-600 transition-colors">
          Ver todas →
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {Object.entries(totalByCurrency).map(([currency, amount]) => (
          <div key={currency} className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted-foreground/60">
              Total invertido en {currency}
            </span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {formatCurrency(amount, currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="divide-y divide-border/40">
        {investments.slice(0, 5).map((inv) => {
          const account = accounts.find((a) => a.id === inv.account_id)
          return (
            <div key={inv.id} className="flex items-center justify-between py-2.5">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {inv.name}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  {account?.name ?? 'Cuenta eliminada'} · {formatInvestmentDate(inv.date)}
                </p>
              </div>
              <span className="text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums shrink-0 ml-3">
                {formatCurrency(inv.amount, inv.currency)}
              </span>
            </div>
          )
        })}
      </div>

      {investments.length > 5 && (
        <p className="text-[10px] text-center text-muted-foreground/40 mt-3 font-medium">
          +{investments.length - 5} inversiones más
        </p>
      )}
    </div>
  )
}

export function InvestmentsByAccount({
  accountId,
  investments,
  compact = true,
}: {
  accountId: string
  investments: Investment[]
  compact?: boolean
}) {
  const accountInvestments = investments.filter((inv) => inv.account_id === accountId)
  const byCurrency = accountInvestments.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.currency] = (acc[inv.currency] ?? 0) + inv.amount
    return acc
  }, {})

  if (accountInvestments.length === 0 && compact) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Invertido: {Object.entries(byCurrency).map(([c, a]) => formatCurrency(a, c)).join(' · ')}
        </span>
      </div>
      {!compact && accountInvestments.length > 1 && (
        <div className="pl-5 space-y-1">
          {accountInvestments.slice(0, 3).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between text-[12px]">
              <span className="text-neutral-600 dark:text-neutral-400">{inv.name}</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                {formatCurrency(inv.amount, inv.currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
