"use client"

import { TrendingUp } from "lucide-react"
import { getTotalInvestedByCurrency } from "../utils/investment-display.utils"
import { formatAssetAmount } from "@/features/accounts/utils/account-display.utils"
import type { Investment } from "@/types/investment"

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
  const byCurrency = getTotalInvestedByCurrency(accountInvestments)

  if (accountInvestments.length === 0 && compact) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider">
          Invertido: {Object.entries(byCurrency).map(([c, a]) => formatAssetAmount(a, c)).join(' · ')}
        </span>
      </div>
      {!compact && accountInvestments.length > 1 && (
        <div className="pl-5 space-y-1">
          {accountInvestments.slice(0, 3).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between text-[12px]">
              <span className="text-zinc-500">{inv.name}</span>
              <span className="font-medium text-zinc-900">
                {formatAssetAmount(inv.amount, inv.currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}