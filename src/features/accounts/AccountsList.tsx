// features/accounts/AccountsList.tsx
"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
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
import { toast } from "sonner"

import { AccountForm } from "./AccountForm"
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from "./hooks/useAccounts"
import { getAccountTypeDetails, formatCurrency } from "./utils/account-display.utils"
import type { Account, CreateAccountData } from "@/types/account"

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function AccountsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
          <Skeleton className="h-4 w-28 rounded-full mb-2" />
          <Skeleton className="h-3 w-16 rounded-full mb-4" />
          <Skeleton className="h-7 w-32 rounded-full" />
        </div>
      ))}
    </div>
  )
}

// ─── Account Card ─────────────────────────────────────────────────────────────
function AccountCard({
  account,
  onEdit,
  onDelete,
}: {
  account:  Account
  onEdit:   (account: Account) => void
  onDelete: (id: string) => void
}) {
  const { icon: Icon, color, bg, label } = getAccountTypeDetails(account.type)
  const isDebt = account.type === 'DEBT'

  return (
    <div
      className="group relative bg-white dark:bg-neutral-900 rounded-[2rem] p-6 flex flex-col gap-6 border border-neutral-200/50 dark:border-neutral-800/50 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-1"
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        {/* Icono con profundidad sutil */}
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center ring-1 ring-inset ring-black/5 dark:ring-white/5 shadow-sm',
          bg.includes('emerald') ? 'bg-emerald-50 dark:bg-emerald-950/30' : 
          bg.includes('rose') ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-neutral-100 dark:bg-neutral-800'
        )}>
          <Icon className={cn('w-6 h-6', color)} />
        </div>

        {/* Acciones flotantes */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
          <button
            onClick={() => onEdit(account)}
            className="p-2 rounded-xl text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(account.id)}
            className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="space-y-1">
        <h3 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug">
          {account.name}
        </h3>
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          {label}
        </p>
      </div>

      {/* ── Balance ── */}
      <div className="pt-5 mt-auto border-t border-neutral-100 dark:border-neutral-800/50">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Balance Actual</span>
        <div className="flex items-baseline gap-1 mt-1">
          <p className={cn(
            'text-2xl font-extrabold tracking-tighter',
            isDebt ? 'text-rose-500' : 'text-neutral-900 dark:text-neutral-100'
          )}>
            {formatCurrency(account.balance, account.currency)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Tipo de dialog ───────────────────────────────────────────────────────────
type DialogState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; account: Account }

// ─── Componente principal ─────────────────────────────────────────────────────
export function AccountsList() {
  const { data: accounts = [], isLoading, isError } = useAccounts()

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

  const totalBalance = accounts
    .filter((a) => a.type !== 'DEBT')
    .reduce((sum, a) => sum + a.balance, 0)

  const totalDebt = accounts
    .filter((a) => a.type === 'DEBT')
    .reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">
            Cuentas
          </h1>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Control total sobre tu liquidez y deudas.
          </p>
        </div>

        <Button
          onClick={() => setDialog({ mode: 'create' })}
          className="h-12 px-6 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-2xl font-bold transition-all duration-200 active:scale-95 shadow-xl shadow-black/10 dark:shadow-white/5 hover:opacity-90"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Cuenta
        </Button>
      </div>

      {/* ── Overview Cards ── */}
      {!isLoading && accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative overflow-hidden bg-emerald-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-emerald-500/20">
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Patrimonio Total</span>
              <p className="text-4xl font-black tracking-tighter mt-2">
                {formatCurrency(totalBalance, 'BOB')}
              </p>
            </div>
            {/* Decoración sutil */}
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-[2rem] p-8 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Deuda Acumulada</span>
            <p className="text-4xl font-black tracking-tighter mt-2 text-rose-500">
              {formatCurrency(totalDebt, 'BOB')}
            </p>
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      {isLoading ? (
        <AccountsGridSkeleton />
      ) : isError ? (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-sm p-6 rounded-[2rem] border border-rose-100 dark:border-rose-900/50 font-medium">
          Error al cargar tus cuentas. Por favor, intenta de nuevo.
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-[2.5rem] bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center mb-6">
            <Plus className="w-8 h-8 text-neutral-300" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Comienza tu legado</h3>
          <p className="text-sm text-neutral-500 mt-2 max-w-[280px]">Registra tu primera cuenta para empezar a rastrear tu patrimonio real.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={(acc) => setDialog({ mode: 'edit', account: acc })}
              onDelete={setPendingDeleteId}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-2xl p-8">
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
        <AlertDialogContent className="rounded-[2.5rem] border-neutral-200 dark:border-neutral-800 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight">¿Eliminar cuenta?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500 dark:text-neutral-400 text-[13px] font-medium leading-relaxed">
              Esta acción es irreversible. Todas las transacciones asociadas perderán su origen, afectando la precisión de tus reportes históricos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl border-neutral-200/50 px-6 font-bold">Mantener</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-6 font-bold"
            >
              Eliminar Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}