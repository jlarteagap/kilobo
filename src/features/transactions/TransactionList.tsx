// features/transactions/TransactionList.tsx
"use client"

import { Fragment, useState } from "react"
import type { ReactNode } from "react"
import { Repeat, Trash2, Pencil, Handshake } from "lucide-react"
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
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
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
  const categoryData = categories.find((c) => c.id === tx.category_id)
  const amountColor  = getTransactionAmountColor(tx.type)
  const sign         = getTransactionSign(tx.type)

  const isTransfer   = tx.type === 'TRANSFER'
  const isDebt       = !isTransfer && !!tx.subtype && DEBT_SUBTYPES.has(tx.subtype)

  // ── Colores derivados del proyecto ────────────────────────────────────────
  const projectColor  = project?.color ?? null
  const rowBg         = projectColor ? `${projectColor}06` : 'transparent'
  const rowBorder     = projectColor ? `2px solid ${projectColor}` : '2px solid transparent'
  const badgeBg       = projectColor ? `${projectColor}18` : 'transparent'
  const badgeBorder   = projectColor ? `0.5px solid ${projectColor}28` : 'none'

  // ── Resolver icono y colores según tipo ────────────────────────────────────
  const TypeIcon = (() => {
    if (isDebt) return Handshake
    if (isTransfer) return getTransactionIcon(tx.type)
    if (project && project.icon) return null // project icon is emoji
    return getSubtypeIcon(tx.subtype) ?? getTransactionIcon(tx.type) ?? null
  })()

  const iconBgStyle = (() => {
    if (isDebt) return '#FFF7ED'
    if (isTransfer) return '#FFFBEB'
    if (projectColor) return `${projectColor}25`
    if (categoryData?.color) return `${categoryData.color}40`
    return '#F3F4F6'
  })()

  const title = (() => {
    if (isTransfer) return 'Transferencia entre cuentas'
    if (isDebt) return tx.description ?? (tx.subtype === 'Préstamo' ? 'Préstamo' : 'Pago de deuda')
    if (project) return tx.subtype ?? 'Sin subtipo'
    return category.name ?? 'Sin categoría'
  })()

  const secondaryLines: ReactNode[] = (() => {
    if (isTransfer) {
      const origin = getAccountName(tx.account_id, accounts)
      const dest   = getAccountName(tx.to_account_id, accounts)
      return [<span key="route" className="text-[11px] text-amber-500">{origin} → {dest}</span>]
    }
    if (isDebt) return []
    const lines: React.ReactNode[] = []
    if (project) {
      lines.push(
        <span
          key="project"
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
          style={{
            color:           projectColor!,
            backgroundColor: badgeBg,
            border:          badgeBorder,
          }}
        >
          {project.icon && <span className="mr-0.5">{project.icon}</span>}
          {project.name}
        </span>
      )
    }
    if (tx.description) {
      lines.push(
        <span key="desc" className="text-[11px] text-gray-400 truncate max-w-[120px]">
          {project ? `· ${tx.description}` : tx.description}
        </span>
      )
    }
    return lines
  })()

  return (
    <tr
      className="group transition-colors duration-100"
      style={{
        backgroundColor: rowBg,
        borderLeft:      rowBorder,
      }}
    >
<td className="px-4 py-3">
        <div className="flex items-center gap-2.5">

          {/* Ícono */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ backgroundColor: iconBgStyle }}
          >
            {project && project.icon ? (
              <span>{project.icon}</span>
            ) : TypeIcon ? (
              <TypeIcon className={cn(
                'w-4 h-4',
                isDebt     && 'text-orange-600',
                isTransfer && 'text-amber-600',
              )} />
            ) : (
              <span className="text-gray-400">📁</span>
            )}
          </div>

          <div className="min-w-0">
            {/* Línea principal */}
            <p className={cn(
              'text-sm font-medium truncate',
              isTransfer && 'text-amber-700',
              !isTransfer && 'text-gray-800',
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
            <span className="inline-flex items-center text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
              {tx.tag}
            </span>
          ) : (
            <span className="text-gray-200">—</span>
          )}
        </div>
      </td>
      {/* ── Tipo ── */}
      <td className="px-4 py-3 hidden sm:table-cell">
        <Badge
          variant="secondary"
          className={cn(
            'text-[10px] font-medium rounded-full',
            tx.type === 'INCOME'   && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
            tx.type === 'EXPENSE'  && 'bg-rose-100    text-rose-700    hover:bg-rose-100',
            tx.type === 'TRANSFER' && 'bg-amber-100   text-amber-700   hover:bg-amber-100',
            tx.type === 'SAVING'   && 'bg-violet-100  text-violet-700  hover:bg-violet-100',
          )}
        >
          {TRANSACTION_TYPE_LABELS[tx.type]}
        </Badge>
      </td>

      {/* ── Cuenta ── */}
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-[13px] text-gray-600">
          {isTransfer && tx.to_account_id
            ? getAccountName(tx.to_account_id, accounts)
            : getAccountName(tx.account_id, accounts)
          }
        </span>
        {!isTransfer && tx.to_account_id ? (
          <span className="text-[13px] text-gray-400">
            {' → '}{getAccountName(tx.to_account_id, accounts)}
          </span>
        ) : null}
      </td>

      {/* ── Monto ── */}
      <td className={cn('px-4 py-3 text-right font-semibold text-sm', amountColor)}>
        <div className="flex items-center justify-end gap-1">
          {tx.is_recurring ? (
            <Repeat className="w-3 h-3 text-gray-400 flex-shrink-0" />
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
            className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-150"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(tx)}
            title="Eliminar"
            className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-150"
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
            <tr className="border-b border-gray-100">
              {['Categoría / Subtipo', 'Tags', 'Tipo', 'Cuenta', 'Monto', ''].map((h) => (
                <th
                  key={h}
                  className={cn(
                    'px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider',
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
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <TransactionRowSkeleton />
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <p className="text-gray-400 text-sm">No hay transacciones registradas.</p>
                  <p className="text-gray-300 text-[13px] mt-1">
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
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold">
              Editar Transacción
            </SheetTitle>
          </SheetHeader>
          {editingTx ? (
            <div className="mt-6">
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
        <AlertDialogContent className="rounded-2xl">
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
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}