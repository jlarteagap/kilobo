"use client"

import { useState, useMemo } from "react"
import { TrendingUp, Pencil, Trash2, Plus, Wallet, Landmark, Banknote, Bitcoin, PiggyBank, ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react"
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

import { useInvestments, useDeleteInvestment, useUpdateInvestment, useInvestmentTransactions, useBuyInvestment, useSellInvestment } from "./hooks/useInvestments"
import { CreateInvestmentForm } from "./CreateInvestmentForm"
import { InvestmentForm } from "./InvestmentForm"
import { InvestmentTxForm } from "./InvestmentTxForm"
import {
  INVESTMENT_ICON,
  INVESTMENT_COLOR,
  formatInvestmentDate,
} from "./utils/investment-display.utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { getAccountTypeDetails } from "@/features/accounts/utils/account-display.utils"

import type { Account, AccountType } from "@/types/account"
import type { Investment, InvestmentTxType, InvestmentTransaction } from "@/types/investment"

function getAccountColors(hex: string) {
  return {
    backgroundColor: `${hex}18`,
    color: hex,
  }
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
    <div className="bg-white rounded-[22px] p-5 space-y-4"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
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

function TxHistory({ investment }: { investment: Investment }) {
  const [open, setOpen] = useState(false)
  const { data: transactions = [], isLoading } = useInvestmentTransactions(investment.id)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-[#6E6E73] hover:text-indigo-500 transition-colors mt-1"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Historial ({isLoading ? '...' : transactions.length} operaciones)
      </button>
      {open && (
        <div className="mt-2 space-y-1 pl-2 border-l-2 border-indigo-100">
          {isLoading ? (
            <p className="text-[11px] text-[#6E6E73]">Cargando...</p>
          ) : transactions.length === 0 ? (
            <p className="text-[11px] text-[#6E6E73]">Sin operaciones registradas</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn(
                    'w-5 h-5 rounded flex items-center justify-center shrink-0',
                    tx.type === 'BUY' ? 'bg-[#F2F9E3]' : 'bg-[#FAEDE9]'
                  )}>
                    {tx.type === 'BUY' ? (
                      <ArrowUpRight className="w-3 h-3 text-[#4F6A35]" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-[#B5543D]" />
                    )}
                  </div>
                  <span className="text-[12px] font-medium text-foreground">
                    {tx.type === 'BUY' ? 'COMPRA' : 'VENTA'}
                  </span>
                  <span className="text-[11px] text-[#6E6E73]">
                    {tx.units} × {formatCurrency(tx.unit_price, tx.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[12px] font-semibold text-foreground tabular-nums">
                    {formatCurrency(tx.total_amount, tx.currency)}
                  </span>
                  <span className="text-[10px] text-[#6E6E73]">
                    {formatInvestmentDate(tx.date)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function InvestmentRow({
  investment,
  onEdit,
  onDelete,
  onBuy,
  onSell,
}: {
  investment: Investment
  onEdit: (inv: Investment) => void
  onDelete: (id: string) => void
  onBuy: (inv: Investment) => void
  onSell: (inv: Investment) => void
}) {
  const hasUnits = investment.units != null && investment.unit_price != null

  return (
    <div className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-indigo-50/30">
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
        INVESTMENT_COLOR.bg
      )}>
        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground truncate">
          {investment.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] font-medium text-[#6E6E73]">
            {formatInvestmentDate(investment.date)}
          </p>
          {hasUnits && (
            <>
              <span className="text-[9px] text-[#6E6E73]/60">·</span>
              <p className="text-[10px] font-medium text-indigo-500">
                {investment.units} units @ {formatCurrency(investment.unit_price!, investment.currency)}/unit
              </p>
            </>
          )}
        </div>
        {hasUnits && <TxHistory investment={investment} />}
      </div>

      <div className="text-right shrink-0">
        <p className="text-[14px] font-bold text-indigo-600 tabular-nums">
          {formatCurrency(investment.amount, investment.currency)}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {hasUnits && (
          <>
            <button
              onClick={() => onBuy(investment)}
              className="p-1.5 rounded-md text-[#4F6A35] hover:bg-[#F2F9E3] transition-colors"
              title="Comprar"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSell(investment)}
              className="p-1.5 rounded-md text-[#B5543D] hover:bg-[#FAEDE9] transition-colors"
              title="Vender"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        <button
          onClick={() => onEdit(investment)}
          className="p-1.5 rounded-md text-[#6E6E73] hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(investment.id)}
          className="p-1.5 rounded-md text-[#6E6E73] hover:text-[#B5543D] hover:bg-[#FAEDE9] transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
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
  const buyInvestment = useBuyInvestment()
  const sellInvestment = useSellInvestment()

  const [showCreate, setShowCreate] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [txOperation, setTxOperation] = useState<{ investment: Investment; type: InvestmentTxType } | null>(null)

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
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Inversiones
          </h1>
          <div className="flex items-center gap-2 text-[12px] text-[#6E6E73]">
            <span>{filtered.length} registros</span>
            <span className="text-[#6E6E73]/60">·</span>
            {Object.entries(totalByCurrency).map(([c, a]) => (
              <span key={c} className="font-semibold text-indigo-600">
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
        <div className="bg-[#FAEDE9] text-[#B5543D] text-[13px] p-4 rounded-xl font-medium">
          Error al cargar inversiones.
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-[22px]"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
        >
          <div className="w-12 h-12 rounded-xl bg-[#F2F9E3] border border-[rgba(0,0,0,0.06)] flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-[#6E6E73]/60" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Sin inversiones aún</h3>
          <p className="text-[12px] text-[#6E6E73] mt-1 max-w-[240px]">
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
                className="bg-white rounded-[22px] overflow-hidden"
                style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
              >
                {/* Account header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(0,0,0,0.06)] bg-[#F2F9E3]/40">
                  {details && (
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={getAccountColors(details.color)}
                    >
                      <AccIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-foreground truncate">
                      {account?.name ?? 'Cuenta eliminada'}
                    </h3>
                    <p className="text-[11px] font-medium text-[#6E6E73]">
                      {details?.label ?? '—'} · Total invertido: {Object.entries(accountByCurrency).map(([c, a]) => formatCurrency(a, c)).join(' · ')}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowCreate(true)}
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] rounded-lg border-[rgba(0,0,0,0.06)]"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Inversión
                  </Button>
                </div>

                {/* Investments list */}
                <div className="divide-y divide-[rgba(0,0,0,0.06)]">
                  {accountInvestments.map((inv) => (
                    <InvestmentRow
                      key={inv.id}
                      investment={inv}
                      onEdit={setEditingInvestment}
                      onDelete={setPendingDeleteId}
                      onBuy={(inv) => setTxOperation({ investment: inv, type: 'BUY' })}
                      onSell={(inv) => setTxOperation({ investment: inv, type: 'SELL' })}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={(open) => !open && setShowCreate(false)}>
        <DialogContent className="sm:max-w-md rounded-[22px] border-none p-8">
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
        <DialogContent className="sm:max-w-md rounded-[22px] border-none p-8">
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

      <Dialog open={!!txOperation} onOpenChange={(open) => !open && setTxOperation(null)}>
        <DialogContent className="sm:max-w-md rounded-[22px] border-none p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              {txOperation?.type === 'BUY' ? 'Comprar' : 'Vender'} {txOperation?.investment.name}
            </DialogTitle>
          </DialogHeader>
          {txOperation && (
            <InvestmentTxForm
              investment={txOperation.investment}
              type={txOperation.type}
              onSubmit={(data) => {
                const mutate = txOperation.type === 'BUY' ? buyInvestment : sellInvestment
                mutate.mutate(data as any, {
                  onSuccess: () => setTxOperation(null),
                })
              }}
              onCancel={() => setTxOperation(null)}
              isPending={buyInvestment.isPending || sellInvestment.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[22px] border-none p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight">
              ¿Eliminar inversión?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#6E6E73] text-[13px] font-medium leading-relaxed">
              El monto invertido será devuelto al saldo de la cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-xl border-[rgba(0,0,0,0.08)] px-6 font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 font-bold"
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
        className="bg-white rounded-[22px] p-5 cursor-pointer hover:shadow-md transition-all"
        onClick={onShowCreate}
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F2F9E3] flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#5F7D42]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-[-0.01em]">
              Inversiones
            </h3>
            <p className="text-[11px] text-[#6E6E73] mt-0.5">
              Sin inversiones registradas
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[22px] p-5"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F2F9E3] flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#5F7D42]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-[-0.01em]">
              Inversiones
            </h3>
            <p className="text-[11px] text-[#6E6E73] mt-0.5">
              {investments.length} registro{investments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#5F7D42] cursor-pointer hover:text-[#4F6A35] transition-colors">
          Ver todas →
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {Object.entries(totalByCurrency).map(([currency, amount]) => (
          <div key={currency} className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#6E6E73]/70">
              Total invertido en {currency}
            </span>
            <span className="text-sm font-bold text-[#4F6A35] tabular-nums">
              {formatCurrency(amount, currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="divide-y divide-[rgba(0,0,0,0.06)]">
        {investments.slice(0, 5).map((inv) => {
          const account = accounts.find((a) => a.id === inv.account_id)
          return (
            <div key={inv.id} className="flex items-center justify-between py-2.5">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {inv.name}
                </p>
                <p className="text-[10px] text-[#6E6E73]/70 mt-0.5">
                  {account?.name ?? 'Cuenta eliminada'} · {formatInvestmentDate(inv.date)}
                </p>
              </div>
              <span className="text-[13px] font-semibold text-[#4F6A35] tabular-nums shrink-0 ml-3">
                {formatCurrency(inv.amount, inv.currency)}
              </span>
            </div>
          )
        })}
      </div>

      {investments.length > 5 && (
        <p className="text-[10px] text-center text-[#6E6E73]/50 mt-3 font-medium">
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
        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
          Invertido: {Object.entries(byCurrency).map(([c, a]) => formatCurrency(a, c)).join(' · ')}
        </span>
      </div>
      {!compact && accountInvestments.length > 1 && (
        <div className="pl-5 space-y-1">
          {accountInvestments.slice(0, 3).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between text-[12px]">
              <span className="text-[#6E6E73]">{inv.name}</span>
              <span className="font-medium text-indigo-600">
                {formatCurrency(inv.amount, inv.currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
