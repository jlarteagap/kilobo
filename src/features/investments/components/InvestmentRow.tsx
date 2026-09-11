"use client"

import { TrendingUp, Pencil, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react"
import { TxHistory } from "./TxHistory"
import { PlanStatus } from "./PlanStatus"
import { formatInvestmentDate } from "../utils/investment-display.utils"
import { formatAssetAmount } from "@/features/accounts/utils/account-display.utils"
import type { Investment } from "@/types/investment"

export function InvestmentRow({
  investment,
  onEdit,
  onDelete,
  onBuy,
  onSell,
  onPlan,
}: {
  investment: Investment
  onEdit: (inv: Investment) => void
  onDelete: (id: string) => void
  onBuy: (inv: Investment) => void
  onSell: (inv: Investment) => void
  onPlan: (inv: Investment) => void
}) {
  return (
    <div className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-50">
      <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
        <TrendingUp className="w-3.5 h-3.5 text-zinc-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-zinc-900 truncate">
          {investment.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] font-medium text-zinc-500">
            {formatInvestmentDate(investment.date)}
          </p>
        </div>
        <TxHistory investment={investment} />
        <PlanStatus investment={investment} />
      </div>

      <div className="text-right shrink-0">
        <p className="text-[14px] font-bold text-zinc-900 tabular-nums">
          {formatAssetAmount(investment.amount, investment.currency)}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onBuy(investment)}
          className="p-1.5 rounded-md text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          title="Comprar más"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onSell(investment)}
          className="p-1.5 rounded-md text-zinc-500 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Vender"
        >
          <ArrowDownRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPlan(investment)}
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          title="Compra recurrente"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onEdit(investment)}
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(investment.id)}
          className="p-1.5 rounded-md text-zinc-500 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}