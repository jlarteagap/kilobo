// features/accounts/AccountsList.tsx
"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Landmark, TrendingUp, ChevronDown, ChevronRight, History } from "lucide-react"

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
import { toast } from "sonner"

import { AccountForm } from "./AccountForm"
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from "./hooks/useAccounts"
import { useAccountDailyDeltas, AccountDailyVariation } from "./hooks/useAccountDailyDeltas"
import { getAccountTypeDetails, formatCurrency, formatChangeAmount, formatAssetAmount, getCurrencyLabel } from "./utils/account-display.utils"
import { convertToBOB } from "@/lib/config/exchange-rates"
import { AccountChangeBadge } from "./components/AccountChangeBadge"
import { AccountHistoryDialog } from "./components/AccountHistoryDialog"
import type { Account, CreateAccountData } from "@/types/account"
import { useInvestments } from "@/features/investments/hooks/useInvestments"

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function AccountsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-[22px] p-4 flex items-center gap-4"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
        >
          <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function AccountCard({
  account,
  onEdit,
  onDelete,
  onOpenHistory,
  variation,
  investments = [],
}: {
  account:        Account
  onEdit:         (account: Account) => void
  onDelete:       (id: string) => void
  onOpenHistory?: () => void
  variation?:     AccountDailyVariation | null
  investments?:   Array<{ id: string; name: string; amount: number; currency: string }>
}) {
  const { icon: Icon, color, label } = getAccountTypeDetails(account.type)
  const [expanded, setExpanded] = useState(false)
  const accountInvestments = investments.filter((inv) => inv.id && inv.currency)
  const hasInvestments = accountInvestments.length > 0
  const totalInvested = accountInvestments.reduce((sum, inv) => sum + inv.amount, 0)

  const showInvestedPill =
    hasInvestments && (!variation || variation.delta === 0)

  return (
    <div className="group bg-white rounded-[22px] transition-all duration-200"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      <div className="p-4 flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-foreground truncate">
            {account.name}
          </h3>
          <p className="text-[11px] font-medium text-[#6E6E73]">
            {label}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenHistory}
          title="Ver historial de cambios"
          className="text-right transition-opacity hover:opacity-80"
        >
          <p className="text-[15px] font-bold tracking-tight text-foreground tabular-nums">
            {formatAssetAmount(account.balance, account.currency)}
          </p>
          <div className="flex items-center justify-end gap-2 mt-1 min-h-[18px]">
            {showInvestedPill ? (
              <p className="text-[10px] font-medium text-indigo-500">
                {formatAssetAmount(totalInvested, account.currency)} invertidos
              </p>
            ) : variation ? (
              <AccountChangeBadge
                delta={variation.delta}
                anchorBalance={variation.anchorBalance}
                lastChangeAt={variation.lastChangeAt}
                currency={account.currency}
              />
            ) : null}
          </div>
        </button>

        <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasInvestments && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-md text-[#6E6E73] hover:text-[#4F6A35] hover:bg-[#F2F9E3] transition-colors"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            onClick={() => onEdit(account)}
            className="p-1.5 rounded-md text-[#6E6E73] hover:text-foreground hover:bg-[#F2F9E3] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(account.id)}
            className="p-1.5 rounded-md text-[#6E6E73] hover:text-[#B5543D] hover:bg-[#FAEDE9] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded investments */}
      {expanded && hasInvestments && (
        <div className="px-4 pb-4 pl-14 space-y-2">
          <div className="h-px bg-[rgba(0,0,0,0.06)] mb-2" />
          {accountInvestments.slice(0, 5).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-indigo-400" />
                <span className="text-foreground">{inv.name}</span>
              </div>
              <span className="font-semibold text-indigo-600 tabular-nums">
                {formatAssetAmount(inv.amount, inv.currency)}
              </span>
            </div>
          ))}
          {accountInvestments.length > 5 && (
            <p className="text-[10px] text-[#6E6E73] text-center pt-1">
              +{accountInvestments.length - 5} inversiones más
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tipo de dialog ───────────────────────────────────────────────────────────
type DialogState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; account: Account }

export function AccountsList() {
  const { data: accounts = [], isLoading, isError } = useAccounts()
  const { data: investments = [] } = useInvestments()
  const variations = useAccountDailyDeltas()

  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const deleteAccount = useDeleteAccount()

  const [dialog, setDialog]                   = useState<DialogState>({ mode: 'closed' })
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [historyAccount, setHistoryAccount]   = useState<Account | null>(null)
  const [sortMode, setSortMode]               = useState<'variation' | 'name' | 'balance'>('variation')

  const handleCreate = (data: CreateAccountData) => {
    createAccount.mutate(data, {
      onSuccess: () => {
        setDialog({ mode: 'closed' })
        toast.success('Cuenta creada correctamente')
      },
      onError: () => toast.error('Error al crear la cuenta'),
    })
  }

  const handleUpdate = (data: CreateAccountData) => {
    if (dialog.mode !== 'edit') return
    updateAccount.mutate({ id: dialog.account.id, data }, {
      onSuccess: () => {
        setDialog({ mode: 'closed' })
        toast.success('Cuenta actualizada correctamente')
      },
      onError: () => toast.error('Error al actualizar la cuenta'),
    })
  }

  const handleDeleteConfirm = () => {
    if (!pendingDeleteId) return
    deleteAccount.mutate(pendingDeleteId, {
      onSuccess: () => {
        toast.success('Cuenta eliminada')
        setPendingDeleteId(null)
      },
      onError: () => {
        toast.error('Error al eliminar la cuenta')
        setPendingDeleteId(null)
      },
    })
  }

  const isDialogOpen = dialog.mode !== 'closed'
  const isPending    = createAccount.isPending || updateAccount.isPending

  // Desglose por moneda: subtotal de cuentas en cada moneda, BOB primero.
  // No hay total único — cada moneda se muestra por separado (las extranjeras
  // con su conversión a BOB).
  const balanceByCurrency = accounts.reduce<Record<string, number>>((acc, a) => {
    acc[a.currency] = (acc[a.currency] ?? 0) + a.balance
    return acc
  }, {})
  const currencyBreakdown = Object.entries(balanceByCurrency)
    .filter(([, value]) => value !== 0)
    .sort(([a], [b]) => {
      if (a === b) return 0
      if (a === 'BOB') return -1
      if (b === 'BOB') return 1
      if (a === 'USD') return -1
      if (b === 'USD') return 1
      return a.localeCompare(b)
    })

  // Variación diaria consolidada en BOB: suma de los deltas de las cuentas con
  // ancla, convertidas a BOB para no mezclar monedas. Silenciosa en cero.
  const totalDailyDelta = accounts.reduce((sum, a) => {
    const variation = variations[a.id]
    if (!variation) return sum
    return sum + convertToBOB(variation.delta, a.currency)
  }, 0)

  // Variación diaria por moneda: delta neto (en la moneda de cada fila),
  // para ver el cambio por moneda (no solo el consolidado en BOB).
  const variationByCurrency = currencyBreakdown.reduce<Record<string, number>>((acc, [currency]) => {
    acc[currency] = accounts.reduce((sum, a) => {
      if (a.currency !== currency) return sum
      const v = variations[a.id]
      return v ? sum + v.delta : sum
    }, 0)
    return acc
  }, {})

  const sortedAccounts = [...accounts]
  if (sortMode === 'name') {
    sortedAccounts.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
  } else if (sortMode === 'balance') {
    sortedAccounts.sort((a, b) => convertToBOB(b.balance, b.currency) - convertToBOB(a.balance, a.currency))
  } else {
    // Variación (hoy): delta neto desc, cuentas sin ancla al final.
    sortedAccounts.sort((a, b) => {
      const da = variations[a.id]?.delta ?? null
      const db = variations[b.id]?.delta ?? null
      if (da === null && db === null) return 0
      if (da === null) return 1
      if (db === null) return -1
      return db - da
    })
  }

  const SORT_OPTIONS: { value: typeof sortMode; label: string }[] = [
    { value: 'variation', label: 'Variación (hoy)' },
    { value: 'name',      label: 'Nombre' },
    { value: 'balance',   label: 'Balance' },
  ]

  // Formatea delta para el chip inline del breakdown: sin símbolo de moneda,
  // con precisión cripto (evita el falso "+0" de formatChangeAmount en BTC).
  function formatVariationValue(value: number, currency: string): string {
    if (currency === 'BOB' || currency === 'USD') {
      return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 }).format(Math.abs(value))
    }
    return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 8 }).format(Math.abs(value))
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Cuentas
          </h1>
          <p className="text-xs font-medium text-[#6E6E73]">
            Resumen de tu liquidez y activos.
          </p>
        </div>

        <Button
          onClick={() => setDialog({ mode: 'create' })}
          className="h-9 px-4 bg-[#4F6A35] hover:bg-[#3C5230] text-white rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva Cuenta
        </Button>
      </div>

      {/* ── Overview Card — Más sutil y elegante ── */}
      {!isLoading && accounts.length > 0 && (
        <div className="rounded-[22px] overflow-hidden">
          <div className="bg-white rounded-[22px] p-6"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6E6E73]">Patrimonio Total</span>
                {totalDailyDelta !== 0 && (
                  <p className={
                    "inline-flex items-center gap-1 mt-2 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums leading-none " +
                    (totalDailyDelta > 0 ? "bg-[#059669]/10 text-[#047857]" : "bg-zinc-900/[0.06] text-[#27272A]")
                  }>
                    <span aria-hidden="true" className={totalDailyDelta > 0 ? "text-[#059669]" : "text-zinc-500"}>
                      {totalDailyDelta > 0 ? "+" : "-"}
                    </span>
                    {formatChangeAmount(totalDailyDelta)}
                    <span aria-hidden="true" className="font-medium opacity-70">Hoy</span>
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-[#F2F9E3] rounded-xl flex items-center justify-center shrink-0">
                <Landmark className="w-6 h-6 text-[#4F6A35]" />
              </div>
            </div>

            {/* Desglose por moneda — cada moneda por separado; las extranjeras
                muestran su conversión a BOB ("≈ Bs"), las de BOB quedan en Bs. */}
            {currencyBreakdown.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.05)]">
                <div className="divide-y divide-[rgba(0,0,0,0.05)]">
                  {currencyBreakdown.map(([currency, value]) => {
                    const delta = variationByCurrency[currency]
                    const isPositive = delta > 0
                    return (
                      <div key={currency} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                        <span className="text-[11px] font-semibold text-[#6E6E73]">
                          {getCurrencyLabel(currency)}
                        </span>
                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span className="text-[12px] font-bold text-foreground tabular-nums">
                              {formatAssetAmount(value, currency)}
                            </span>
                            {currency !== 'BOB' && (
                              <span className="text-[11px] font-medium text-[#6E6E73] tabular-nums">
                                ≈ {formatCurrency(convertToBOB(value, currency), 'BOB')}
                              </span>
                            )}
                          </div>
                          {delta !== 0 && (
                            <p className={
                              "mt-0.5 text-[10px] font-bold tabular-nums leading-none " +
                              (isPositive ? "text-[#047857]" : "text-[#27272A]")
                            }>
                              <span aria-hidden="true" className="font-semibold">
                                {isPositive ? '+' : '−'}
                              </span>
                              {formatVariationValue(delta, currency)}
                              <span className="font-medium opacity-70"> hoy</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Control de orden */}
          <div className="flex items-center justify-end gap-1 pt-4">
            <History className="w-3.5 h-3.5 text-[#6E6E73]" aria-hidden="true" />
            <span className="text-[11px] font-medium text-[#6E6E73] mr-1">Ordenar</span>
            <div className="inline-flex items-center gap-0.5 rounded-full bg-white p-0.5"
              style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
            >
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSortMode(option.value)}
                  className={
                    "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors " +
                    (sortMode === option.value
                      ? "bg-zinc-900 text-white"
                      : "text-[#6E6E73] hover:text-foreground")
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Grid — 2 columnas para tarjetas horizontales ── */}
      {isLoading ? (
        <AccountsGridSkeleton />
      ) : isError ? (
        <div className="bg-[#FAEDE9] text-[#B5543D] text-[13px] p-4 rounded-xl font-medium">
          Error al cargar tus cuentas.
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-[22px]"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
        >
          <div className="w-12 h-12 rounded-xl bg-[#F2F9E3] border border-[rgba(0,0,0,0.06)] flex items-center justify-center mb-4">
            <Plus className="w-5 h-5 text-[#4F6A35]" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Sin cuentas aún</h3>
          <p className="text-[12px] text-[#6E6E73] mt-1 max-w-[240px]">Registra tu primera cuenta para empezar a rastrear tu patrimonio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
          {sortedAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              variation={variations[account.id] ?? null}
              investments={investments.filter((inv) => inv.account_id === account.id)}
              onEdit={(acc) => setDialog({ mode: 'edit', account: acc })}
              onDelete={setPendingDeleteId}
              onOpenHistory={() => setHistoryAccount(account)}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}>
        <DialogContent className="sm:max-w-md rounded-[22px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              {dialog.mode === 'edit' ? 'Ajustar Cuenta' : 'Nueva Cuenta'}
            </DialogTitle>
          </DialogHeader>
          <AccountForm
            initialData={dialog.mode === 'edit' ? dialog.account : undefined}
            onSubmit={dialog.mode === 'edit' ? handleUpdate : handleCreate}
            onCancel={() => setDialog({ mode: 'closed' })}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[22px] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight">¿Eliminar cuenta?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6E6E73] text-[13px] font-medium leading-relaxed">
              Esta acción es irreversible. Todas las transacciones asociadas perderán su origen, afectando la precisión de tus reportes históricos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-xl border-[rgba(0,0,0,0.08)] px-6 font-bold">Mantener</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-[#B5543D] hover:bg-[#B5543D]/90 text-white px-6 font-bold"
            >
              Eliminar Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Historial de cambios ── */}
      <AccountHistoryDialog
        account={historyAccount}
        open={Boolean(historyAccount)}
        onOpenChange={(open) => !open && setHistoryAccount(null)}
        anchorBalance={historyAccount ? variations[historyAccount.id]?.anchorBalance ?? null : null}
      />
    </div>
  )
}