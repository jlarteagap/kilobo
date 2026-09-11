"use client"

import { useState, useMemo } from "react"
import { TrendingUp, Wallet, Plus } from "lucide-react"
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
import { Button } from "@/components/ui/button"

import { useInvestments, useDeleteInvestment, useUpdateInvestment, useBuyInvestment, useSellInvestment } from "./hooks/useInvestments"
import { CreateInvestmentForm } from "./CreateInvestmentForm"
import { InvestmentForm } from "./InvestmentForm"
import { InvestmentTxForm } from "./InvestmentTxForm"
import { RecurringPlanDialog } from "./RecurringPlanDialog"
import { AccountCardSkeleton as AccountSkeleton, accountIconMap, getAccountColors } from "./components/InvestmentShared"
import { InvestmentRow } from "./components/InvestmentRow"
import { UpcomingPurchases } from "./components/UpcomingPurchases"
import { getTotalInvestedByCurrency, getTotalInvestedInBOB } from "./utils/investment-display.utils"
import { formatAssetAmount, formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { getAccountTypeDetails } from "@/features/accounts/utils/account-display.utils"
import type { BuyInvestmentInput } from "@/lib/validations/investment.schema"

import type { Account } from "@/types/account"
import type { Investment, InvestmentTxType } from "@/types/investment"

export { InvestmentsWidget } from "./components/InvestmentsWidget"
export { InvestmentsByAccount } from "./components/InvestmentsByAccount"

interface InvestmentsListProps {
  accounts: Account[]
  preselectedAccountId?: string
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
  const [planInvestment, setPlanInvestment] = useState<Investment | null>(null)

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

  const totalByCurrency = getTotalInvestedByCurrency(filtered)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Inversiones
          </h1>
          <div className="flex items-center gap-2 text-[12px] text-zinc-500">
            <span>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-zinc-400">·</span>
            {Object.entries(totalByCurrency).map(([c, a]) => (
              <span key={c} className="font-semibold text-zinc-900">
                {formatAssetAmount(a, c)}
              </span>
            ))}
            {Object.keys(totalByCurrency).length > 1 && (
              <>
                <span className="text-zinc-400">≈</span>
                <span className="font-semibold text-zinc-900">
                  {formatCurrency(getTotalInvestedInBOB(filtered), 'BOB')}
                </span>
              </>
            )}
          </div>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="h-9 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva Inversión
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <AccountSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-zinc-50 text-zinc-500 text-[13px] p-4 rounded-xl border border-zinc-200 font-medium">
          Error al cargar inversiones.
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-[22px] border border-zinc-200">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-zinc-400" />
          </div>
          <h3 className="text-sm font-medium text-zinc-900">Sin inversiones aún</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-[240px] leading-relaxed">
            Registra una inversión para empezar a rastrear tu cartera.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <UpcomingPurchases investments={filtered} />
          {Object.entries(groupedByAccount).map(([accountId, accountInvestments]) => {
            const account = getAccount(accountId)
            const accountByCurrency = getTotalInvestedByCurrency(accountInvestments)
            const details = account ? getAccountTypeDetails(account.type) : null
            const AccIcon = account ? accountIconMap[account.type] : Wallet

            return (
              <div
                key={accountId}
                className="bg-white rounded-[22px] border border-zinc-200 overflow-hidden"
              >
                {/* Account header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 bg-zinc-50/80">
                  {details && (
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={getAccountColors(details.color)}
                    >
                      <AccIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-zinc-900 truncate">
                      {account?.name ?? 'Cuenta eliminada'}
                    </h3>
                    <p className="text-[11px] font-medium text-zinc-500">
                      {details?.label ?? '—'} · Total invertido: {Object.entries(accountByCurrency).map(([c, a]) => formatAssetAmount(a, c)).join(' · ')}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowCreate(true)}
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] rounded-lg border-zinc-200 text-zinc-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Inversión
                  </Button>
                </div>

                {/* Investments list */}
                <div className="divide-y divide-zinc-100">
                  {accountInvestments.map((inv) => (
                    <InvestmentRow
                      key={inv.id}
                      investment={inv}
                      onEdit={setEditingInvestment}
                      onDelete={setPendingDeleteId}
                      onBuy={(inv) => setTxOperation({ investment: inv, type: 'BUY' })}
                      onSell={(inv) => setTxOperation({ investment: inv, type: 'SELL' })}
                      onPlan={setPlanInvestment}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={(open) => !open && setShowCreate(false)}>
        <DialogContent className="sm:max-w-md rounded-[22px] border border-zinc-200 p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-zinc-900 tracking-tight">
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
        <DialogContent className="sm:max-w-md rounded-[22px] border border-zinc-200 p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-zinc-900 tracking-tight">
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
        <DialogContent className="sm:max-w-md rounded-[22px] border border-zinc-200 p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-zinc-900 tracking-tight">
              {txOperation?.type === 'BUY' ? 'Comprar' : 'Vender'} {txOperation?.investment.name}
            </DialogTitle>
          </DialogHeader>
          {txOperation && (
            <InvestmentTxForm
              investment={txOperation.investment}
              type={txOperation.type}
              onSubmit={(data) => {
                const mutate = txOperation.type === 'BUY' ? buyInvestment : sellInvestment
                mutate.mutate(data as BuyInvestmentInput, {
                  onSuccess: () => setTxOperation(null),
                })
              }}
              onCancel={() => setTxOperation(null)}
              isPending={buyInvestment.isPending || sellInvestment.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {planInvestment && (
        <RecurringPlanDialog
          key={planInvestment.id}
          investment={planInvestment}
          open
          onOpenChange={(open) => !open && setPlanInvestment(null)}
        />
      )}

      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[22px] border border-zinc-200 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-zinc-900 tracking-tight">
              ¿Eliminar inversión?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500 text-[13px] font-medium leading-relaxed">
              El monto invertido será devuelto al saldo de la cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-xl border-zinc-200 px-6 font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-6 font-bold"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}