"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react"
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
import { useInvestmentTransactions, useDeleteInvestmentTransaction } from "../hooks/useInvestments"
import { formatInvestmentDate } from "../utils/investment-display.utils"
import { formatAssetAmount } from "@/features/accounts/utils/account-display.utils"
import type { Investment } from "@/types/investment"

export function TxHistory({ investment }: { investment: Investment }) {
  const [open, setOpen] = useState(false)
  const [pendingDeleteTx, setPendingDeleteTx] = useState<string | null>(null)
  const { data: transactions = [], isLoading } = useInvestmentTransactions(investment.id)
  const deleteTx = useDeleteInvestmentTransaction()

  const handleDeleteConfirm = () => {
    if (!pendingDeleteTx) return
    deleteTx.mutate(
      { investmentId: investment.id, txId: pendingDeleteTx },
      {
        onSuccess: () => setPendingDeleteTx(null),
        onError: () => setPendingDeleteTx(null),
      }
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors mt-1"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Historial ({isLoading ? '...' : transactions.length} operaciones)
      </button>
      {open && (
        <div className="mt-2 space-y-1 pl-2 border-l-2 border-zinc-200">
          {isLoading ? (
            <p className="text-[11px] text-zinc-500">Cargando...</p>
          ) : transactions.length === 0 ? (
            <p className="text-[11px] text-zinc-500">Sin operaciones registradas</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="group/tx flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn(
                    'w-5 h-5 rounded flex items-center justify-center shrink-0',
                    tx.type === 'BUY' ? 'bg-emerald-50' : 'bg-red-50'
                  )}>
                    {tx.type === 'BUY' ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                  <span className="text-[12px] font-medium text-zinc-900">
                    {tx.type === 'BUY' ? 'COMPRA' : 'VENTA'}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn(
                    "text-[12px] font-semibold tabular-nums",
                    tx.type === 'BUY' ? "text-zinc-900" : "text-red-500"
                  )}>
                    {tx.type === 'BUY' ? '+' : '-'}
                    {formatAssetAmount(tx.amount ?? 0, tx.currency)}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {formatInvestmentDate(tx.date)}
                  </span>
                  <button
                    onClick={() => setPendingDeleteTx(tx.id)}
                    className="p-1 rounded text-zinc-300 opacity-0 group-hover/tx:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Eliminar operación"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AlertDialog
        open={!!pendingDeleteTx}
        onOpenChange={(open) => !open && setPendingDeleteTx(null)}
      >
        <AlertDialogContent className="rounded-[22px] border border-zinc-200 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-zinc-900 tracking-tight">
              ¿Eliminar operación?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500 text-[13px] font-medium leading-relaxed">
              El saldo de la cuenta se ajustará para revertir esta operación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-xl border-zinc-200 px-6 font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteTx.isPending}
              className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-6 font-bold"
            >
              {deleteTx.isPending ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}