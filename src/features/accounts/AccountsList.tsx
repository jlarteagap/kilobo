// features/accounts/AccountsList.tsx
"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Landmark, TrendingUp, ChevronDown, ChevronRight } from "lucide-react"

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
import { useAccountBalanceChanges } from "./hooks/useAccountBalanceChanges"
import { getAccountTypeDetails, formatCurrency } from "./utils/account-display.utils"
import { AccountChangeBadge } from "./components/AccountChangeBadge"
import type { Account, CreateAccountData, AccountBalanceChange } from "@/types/account"
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
  lastChange,
  investments = [],
}: {
  account:        Account
  onEdit:         (account: Account) => void
  onDelete:       (id: string) => void
  lastChange?:    AccountBalanceChange | null
  investments?:   Array<{ id: string; name: string; amount: number; currency: string }>
}) {
  const { icon: Icon, color, label } = getAccountTypeDetails(account.type)
  const [expanded, setExpanded] = useState(false)
  const accountInvestments = investments.filter((inv) => inv.id && inv.currency)
  const hasInvestments = accountInvestments.length > 0
  const totalInvested = accountInvestments.reduce((sum, inv) => sum + inv.amount, 0)

  // Ancla de la variación diaria: balance al cierre del día anterior (4:00 AM).
  const dailyDelta = lastChange ? account.balance - lastChange.new_balance : null

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

        <div className="text-right">
          <p className="text-[15px] font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(account.balance, account.currency)}
          </p>
          <div className="flex items-center justify-end gap-2 mt-1 min-h-[18px]">
            {lastChange ? (
              <AccountChangeBadge
                delta={dailyDelta}
                anchorBalance={lastChange.new_balance}
                lastChangeAt={lastChange.createdAt}
                currency={account.currency}
              />
            ) : hasInvestments ? (
              <p className="text-[10px] font-medium text-indigo-500">
                {formatCurrency(totalInvested, account.currency)} invertidos
              </p>
            ) : null}
          </div>
        </div>

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
                {formatCurrency(inv.amount, inv.currency)}
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
  const { data: lastChanges = {} } = useAccountBalanceChanges(accounts.map((a) => a.id))

  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const deleteAccount = useDeleteAccount()

  const [dialog, setDialog]                   = useState<DialogState>({ mode: 'closed' })
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

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

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

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
        <div className="relative overflow-hidden bg-white rounded-[22px] p-6"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6E6E73]">Patrimonio Total</span>
              <p className="text-2xl font-bold tracking-tight mt-1 text-foreground">
                {formatCurrency(totalBalance, 'BOB')}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#F2F9E3] rounded-xl flex items-center justify-center">
              <Landmark className="w-6 h-6 text-[#4F6A35]" />
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
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              lastChange={lastChanges[account.id]}
              investments={investments.filter((inv) => inv.account_id === account.id)}
              onEdit={(acc) => setDialog({ mode: 'edit', account: acc })}
              onDelete={setPendingDeleteId}
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
    </div>
  )
}