// features/transactions/TransactionList.tsx
"use client"

import { Fragment, useState } from "react"
import type { ReactNode } from "react"
import { Repeat, Trash2, Pencil, Folder } from "lucide-react"
import { cn } from "@/lib/utils"

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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import {
  useDeleteTransaction,
  useUpdateTransaction,
  EditableTransactionFields,
} from "@/features/transactions/hooks/useTransactions"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import {
  getTransactionAmountColor,
  getTransactionSign,
  getTransactionIcon,
  getSubtypeIcon,
  getAccountName,
  getCategoryDisplay,
  formatTransactionDate,
  normalizeCurrency,
  TRANSACTION_TYPE_LABELS,
  INVESTMENT_COLORS,
} from "@/features/transactions/utils/transaction-display.utils"

import type { Transaction } from "@/types/transaction"
import type { Account } from "@/types/account"
import type { Category } from "@/types/category"
import type { Project } from '@/types/project'

import { TransactionEditForm } from "./TransactionEditForm"
import { TransactionTotals } from "./TransactionTotal"
// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TransactionRowSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28 rounded-full" />
                <Skeleton className="h-3 w-16 rounded-full" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-5 w-14 rounded-full" /></td>
          <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></td>
          <td className="px-4 py-3"><Skeleton className="h-4 w-20 rounded-full" /></td>
          <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-16 rounded-full ml-auto" /></td>
          <td className="px-4 py-3" />
        </tr>
      ))}
    </>
  )
}

// ─── Separador de fecha ───────────────────────────────────────────────────────
function DateSeparator({ date }: { date: string }) {
  return (
    <tr>
      <td colSpan={6} className="px-4 pt-5 pb-1">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          {formatTransactionDate(date)}
        </span>
      </td>
    </tr>
  )
}

// ─── Fila de transacción ──────────────────────────────────────────────────────
const DEBT_SUBTYPES = new Set(['Préstamo', 'Pago de deuda'])

function TransactionRow({
  tx,
  accounts,
  categories,
  projects,
  onEdit,
  onDelete,
}: {
  tx:         Transaction
  accounts:   Account[]
  categories: Category[]
  projects:   Project[]
  onEdit:     (tx: Transaction) => void
  onDelete:   (tx: Transaction) => void
}) {
  const category     = getCategoryDisplay(tx.category_id, categories)
  const project      = projects.find((p) => p.id === tx.project_id)
  const isInvestment = !!tx.investment_id
  const isTransfer   = tx.type === 'TRANSFER'
  const amountColor  = isInvestment ? 'text-zinc-600' : getTransactionAmountColor(tx.type)
  const sign         = getTransactionSign(tx.type)
  const isDebt       = !isTransfer && !!tx.subtype && DEBT_SUBTYPES.has(tx.subtype)

  // ── Resolver icono y colores según tipo ────────────────────────────────────
  const typeIcon = (() => {
    if (isInvestment) return INVESTMENT_COLORS.icon
    if (isDebt) return getSubtypeIcon(tx.subtype) ?? null
    if (isTransfer) return getTransactionIcon(tx.type)
    return getSubtypeIcon(tx.subtype) ?? getTransactionIcon(tx.type) ?? null
  })()

  const iconBgStyle = '#F4F4F5'

  const title = (() => {
    if (isInvestment) return tx.description ?? 'Inversión'
    if (isTransfer) return 'Transferencia entre cuentas'
    if (isDebt) return tx.description ?? (tx.subtype === 'Préstamo' ? 'Préstamo' : 'Pago de deuda')
    if (project) return tx.subtype ?? 'Sin etiqueta'
    return category.name ?? 'Sin categoría'
  })()

  const secondaryLines: ReactNode[] = (() => {
    if (isInvestment) {
      const accountName = getAccountName(tx.account_id, accounts)
      return [<span key="acct" className="text-[11px] text-zinc-500">{accountName}</span>]
    }
    if (isTransfer) {
      const origin = getAccountName(tx.account_id, accounts)
      const dest   = getAccountName(tx.to_account_id, accounts)
      return [<span key="route" className="text-[11px] text-zinc-500">{origin} → {dest}</span>]
    }
    if (isDebt) return []
    const lines: React.ReactNode[] = []
    if (project) {
      lines.push(
        <span
          key="project"
          className="text-[10px] font-medium text-zinc-500 px-1.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200"
        >
          {project.name}
        </span>
      )
    }
    if (tx.description) {
      lines.push(
        <span key="desc" className="text-[11px] text-[#6E6E73] truncate max-w-[120px]">
          {project ? `· ${tx.description}` : tx.description}
        </span>
      )
    }
    return lines
  })()

  return (
    <tr
      className="group transition-colors duration-100 hover:bg-zinc-50/60"
    >
<td className="px-4 py-3">
        <div className="flex items-center gap-2.5">

          {/* Ícono */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ backgroundColor: iconBgStyle }}
          >
              {typeIcon ? (
              (() => {
                const Icon = typeIcon
                return (
                  <Icon className={cn(
                    'w-4 h-4',
                    isInvestment && 'text-zinc-600',
                    isDebt       && 'text-zinc-600',
                    isTransfer   && 'text-zinc-500',
                  )} />
                )
              })()
            ) : (
              <Folder className="w-4 h-4 text-zinc-400" />
            )}
          </div>

          <div className="min-w-0">
            {/* Línea principal */}
            <p className={cn(
              'text-sm font-medium truncate',
              isTransfer && 'text-zinc-500',
              !isTransfer && 'text-foreground',
            )}>
              {title}
            </p>

            {/* Línea secundaria */}
            {secondaryLines.length > 0 && (
              <div className="flex items-center gap-1.5 mt-0.5">
                {secondaryLines}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* ── Tag ── */}
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="flex gap-2">
          {tx.tag ? (
            <span className="inline-flex items-center text-[11px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
              {tx.tag}
            </span>
          ) : (
            <span className="text-[rgba(0,0,0,0.16)]">—</span>
          )}
        </div>
      </td>
      {/* ── Tipo ── */}
      <td className="px-4 py-3 hidden sm:table-cell">
        <Badge
          variant="secondary"
          className={cn(
            'text-[10px] font-medium rounded-full',
            isInvestment && 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100',
            !isInvestment && tx.type === 'INCOME'   && 'bg-zinc-100 text-zinc-700 hover:bg-zinc-100',
            !isInvestment && tx.type === 'EXPENSE'  && 'bg-zinc-100 text-zinc-800 hover:bg-zinc-100',
            !isInvestment && tx.type === 'TRANSFER' && 'bg-zinc-100 text-zinc-500 hover:bg-zinc-100',
            !isInvestment && tx.type === 'SAVING'   && 'bg-zinc-100 text-zinc-600 hover:bg-zinc-100',
          )}
        >
          {isInvestment ? 'Inversión' : TRANSACTION_TYPE_LABELS[tx.type]}
        </Badge>
      </td>

      {/* ── Cuenta ── */}
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-[13px] text-[#6E6E73]">
          {isTransfer && tx.to_account_id
            ? getAccountName(tx.to_account_id, accounts)
            : getAccountName(tx.account_id, accounts)
          }
        </span>
        {!isTransfer && tx.to_account_id ? (
          <span className="text-[13px] text-[#6E6E73]/70">
            {' → '}{getAccountName(tx.to_account_id, accounts)}
          </span>
        ) : null}
      </td>

      {/* ── Monto ── */}
      <td className={cn('px-4 py-3 text-right font-semibold text-sm', amountColor)}>
        <div className="flex items-center justify-end gap-1">
          {tx.is_recurring ? (
            <Repeat className="w-3 h-3 text-zinc-400 flex-shrink-0" />
          ) : null}
          {sign}{formatCurrency(tx.amount, normalizeCurrency(tx.currency))}
        </div>
      </td>

      {/* ── Acciones ── */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => onEdit(tx)}
            title="Editar"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all duration-150"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(tx)}
            title="Eliminar"
            className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function TransactionList({
  transactions,
  accounts,
  categories,
  projects,
  loading = false,
}: {
  transactions: Transaction[]
  accounts:     Account[]
  categories:   Category[]
  projects:     Project[]
  loading?:     boolean
}) {
  const deleteTransaction = useDeleteTransaction()
  const updateTransaction = useUpdateTransaction()

  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)
  const [editingTx, setEditingTx]         = useState<Transaction | null>(null)

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return
    await deleteTransaction.mutateAsync(pendingDelete)
    setPendingDelete(null)
  }

  const handleEditSave = async (data: EditableTransactionFields) => {
    if (!editingTx) return
    await updateTransaction.mutateAsync({ id: editingTx.id, data })
    setEditingTx(null)
  }

  // ─── Agrupar por fecha ──────────────────────────────────────────────────────
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const date = tx.date.slice(0, 10)  // ← tomar solo "yyyy-MM-dd" sin parsear
    if (!acc[date]) acc[date] = []
    acc[date].push(tx)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">

          {/* ── Header ── */}
          <thead>
            <tr className="border-b border-zinc-200">
              {['Categoría / Etiqueta', 'Tags', 'Tipo', 'Cuenta', 'Monto', ''].map((h) => (
                <th
                  key={h}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-[0.14em]',
                    h === 'Monto' && 'text-right',
                    (h === 'Tags' || h === 'Tipo') && 'hidden sm:table-cell',
                    h === 'Cuenta' && 'hidden md:table-cell',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <TransactionRowSkeleton />
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <p className="text-zinc-900 text-sm font-medium">No hay transacciones registradas.</p>
                  <p className="text-zinc-500 text-[13px] mt-1">
                    Crea tu primera transacción con el botón de arriba.
                  </p>
                </td>
              </tr>
            ) : (
              sortedDates.map((date) => (
                <Fragment key={`frag-${date}`}>
                  <DateSeparator key={`sep-${date}`} date={date} />
                  {grouped[date].map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      accounts={accounts}
                      categories={categories}
                      projects={projects}
                      onEdit={setEditingTx}
                      onDelete={setPendingDelete}
                    />
                  ))}
                </Fragment>
              ))
            )}
          </tbody>
          {/* ── Totales — solo si hay transacciones y no está cargando ── */}
          {!loading && transactions.length > 0 ? (
            <TransactionTotals transactions={transactions} />
          ) : null}
        </table>
      </div>

      {/* ── Sheet de edición ── */}
      <Sheet open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader className="px-6 pt-6 pb-0">
            <SheetTitle className="text-lg font-semibold">
              Editar Transacción
            </SheetTitle>
          </SheetHeader>
          {editingTx ? (
            <div className="px-6 pb-6 overflow-y-auto">
              <TransactionEditForm
                transaction={editingTx}
                categories={categories}
                onSuccess={() => setEditingTx(null)}
                onSave={handleEditSave}
              />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* ── AlertDialog confirmación de borrado ── */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent className="rounded-[22px] border-none">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta transacción?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El balance de la cuenta
              se ajustará automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-[#B5543D] hover:bg-[#B5543D]/90 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}