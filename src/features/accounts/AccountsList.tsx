// features/accounts/AccountsList.tsx
"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Landmark } from "lucide-react"
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900/50 rounded-xl p-4 flex items-center gap-4 border border-neutral-200/60 dark:border-neutral-800/60"
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

  return (
    <div
      className="group relative bg-white dark:bg-neutral-900/50 rounded-xl p-4 flex items-center gap-4 border border-neutral-200/60 dark:border-neutral-800/60 transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm"
    >
      {/* Icono más compacto */}
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors',
        bg.includes('emerald') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 
        bg.includes('rose') ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' : 
        bg.includes('blue') ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30' :
        bg.includes('purple') ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/30' :
        bg.includes('orange') ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/30' :
        'bg-neutral-100 text-neutral-600 dark:bg-neutral-800'
      )}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Info Principal */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
          {account.name}
        </h3>
        <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
          {label}
        </p>
      </div>

      {/* Balance - alineación derecha */}
      <div className="text-right">
        <p className="text-[15px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {formatCurrency(account.balance, account.currency)}
        </p>
      </div>

      {/* Acciones flotantes discretas */}
      <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(account)}
          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(account.id)}
          className="p-1.5 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
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

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Cuentas
          </h1>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Resumen de tu liquidez y activos.
          </p>
        </div>

        <Button
          onClick={() => setDialog({ mode: 'create' })}
          className="h-9 px-4 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva Cuenta
        </Button>
      </div>

      {/* ── Overview Card — Más sutil y elegante ── */}
      {!isLoading && accounts.length > 0 && (
        <div className="relative overflow-hidden bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">Patrimonio Total</span>
              <p className="text-2xl font-bold tracking-tight mt-1 text-neutral-900 dark:text-neutral-100">
                {formatCurrency(totalBalance, 'BOB')}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Landmark className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
            </div>
          </div>
        </div>
      )}

      {/* ── Grid — 2 columnas para tarjetas horizontales ── */}
      {isLoading ? (
        <AccountsGridSkeleton />
      ) : isError ? (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-[13px] p-4 rounded-xl border border-rose-100 dark:border-rose-900/50 font-medium">
          Error al cargar tus cuentas.
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/20">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center mb-4">
            <Plus className="w-5 h-5 text-neutral-300" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Sin cuentas aún</h3>
          <p className="text-[12px] text-neutral-500 mt-1 max-w-[240px]">Registra tu primera cuenta para empezar a rastrear tu patrimonio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
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