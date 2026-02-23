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

  const isDebt      = account.type === 'DEBT'
  const balanceColor = isDebt ? 'text-rose-500' : 'text-gray-900'

  return (
    <div
      className="group relative bg-white rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        {/* Icono */}
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', `${bg}/10`)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>

        {/* Acciones — visibles en hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => onEdit(account)}
            title="Editar"
            className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all duration-150"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(account.id)}
            title="Eliminar"
            className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all duration-150"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="flex-1">
        <p className="font-semibold text-gray-900 text-sm leading-tight">
          {account.name}
        </p>
        <p className="text-[12px] text-gray-400 mt-0.5">{label}</p>
      </div>

      {/* ── Balance ── */}
      <div className="pt-3 border-t border-gray-50">
        <p className="text-[11px] text-gray-400 mb-0.5">Balance</p>
        <p className={cn('text-xl font-semibold tracking-tight', balanceColor)}>
          {formatCurrency(account.balance, account.currency)}
        </p>
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

  // ─── Handlers ──────────────────────────────────────────────────────────────
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

  // ─── Total patrimonio ───────────────────────────────────────────────────────
  const totalBalance = accounts
    .filter((a) => a.type !== 'DEBT')
    .reduce((sum, a) => sum + a.balance, 0)

  const totalDebt = accounts
    .filter((a) => a.type === 'DEBT')
    .reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Cuentas
          </h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Button
          onClick={() => setDialog({ mode: 'create' })}
          className="gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Nueva Cuenta
        </Button>
      </div>

      {/* ── Stats rápidas ── */}
      {!isLoading && accounts.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div
            className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <span className="text-[13px] font-medium text-gray-500">Patrimonio</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(totalBalance, 'BOB')}
            </span>
          </div>
          <div
            className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <span className="text-[13px] font-medium text-gray-500">Deudas</span>
            <span className="text-sm font-semibold text-rose-500">
              {formatCurrency(totalDebt, 'BOB')}
            </span>
          </div>
        </div>
      )}

      {/* ── Grid de cuentas ── */}
      {isLoading ? (
        <AccountsGridSkeleton />
      ) : isError ? (
        <div className="bg-rose-50 text-rose-500 text-sm p-4 rounded-xl">
          Error al cargar las cuentas. Intenta nuevamente.
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No hay cuentas registradas.</p>
          <p className="text-gray-300 text-[13px] mt-1">
            Crea tu primera cuenta con el botón de arriba.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* ── Dialog crear / editar ── */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {dialog.mode === 'edit' ? 'Editar cuenta' : 'Nueva cuenta'}
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

      {/* ── AlertDialog confirmar borrado ── */}
      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las transacciones asociadas
              perderán la referencia a esta cuenta.
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