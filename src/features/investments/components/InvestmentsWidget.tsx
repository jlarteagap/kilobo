"use client"

import { TrendingUp, RefreshCw } from "lucide-react"
import Link from "next/link"
import { isPlanDue, nextDueString } from "../utils/recurrence.utils"
import { formatInvestmentDate, getTotalInvestedByCurrency, getTotalInvestedInBOB } from "../utils/investment-display.utils"
import { formatAssetAmount, formatCurrency } from "@/features/accounts/utils/account-display.utils"
import type { Account } from "@/types/account"
import type { Investment } from "@/types/investment"

export function InvestmentsWidget({
  investments,
  accounts,
  onShowCreate,
}: {
  investments: Investment[]
  accounts: Account[]
  onShowCreate: () => void
}) {
  const Icon = TrendingUp
  const totalByCurrency = getTotalInvestedByCurrency(investments)

  const nextPlan = investments
    .filter((inv) => inv.recurrence?.enabled)
    .map((inv) => ({
      investment: inv,
      plan: inv.recurrence!,
      due: isPlanDue(inv.recurrence!, new Date()),
      date: inv.recurrence!.next_due ?? nextDueString(new Date(), inv.recurrence!.day_of_week),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  if (investments.length === 0) {
    return (
      <div
        className="bg-white rounded-[22px] border border-zinc-200 p-5 cursor-pointer hover:shadow-md transition-all"
        onClick={onShowCreate}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
              Inversiones
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Sin inversiones registradas
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[22px] border border-zinc-200 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
              Inversiones
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {investments.length} registro{investments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link
          href="/accounts?tab=inversiones"
          className="text-[10px] font-bold text-zinc-900 hover:text-zinc-600 transition-colors"
        >
          Ver todas →
        </Link>
      </div>

      <div className="space-y-3 mb-4">
        {Object.entries(totalByCurrency).map(([currency, amount]) => (
          <div key={currency} className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-zinc-500">
              Total invertido en {currency}
            </span>
            <span className="text-sm font-bold text-zinc-900 tabular-nums">
              {formatAssetAmount(amount, currency)}
            </span>
          </div>
        ))}
        {Object.keys(totalByCurrency).length > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-100 pt-3 mt-3">
            <span className="text-[12px] font-medium text-zinc-500">
              Total en BOB
            </span>
            <span className="text-sm font-bold text-zinc-900 tabular-nums">
              {formatCurrency(getTotalInvestedInBOB(investments), 'BOB')}
            </span>
          </div>
        )}
      </div>

      {nextPlan && (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-3.5 py-2.5 flex items-center gap-2 mb-4">
          <RefreshCw className="w-3 h-3 text-zinc-500 shrink-0" />
          <p className="text-[11px] font-semibold text-zinc-700 truncate">
            {nextPlan.due ? 'Pendiente' : 'Próxima compra'} · {nextPlan.investment.name} ·{' '}
            {formatInvestmentDate(nextPlan.date)} · {formatAssetAmount(nextPlan.plan.amount, nextPlan.plan.currency)}
          </p>
        </div>
      )}

      <div className="divide-y divide-zinc-100">
        {investments.slice(0, 5).map((inv) => {
          const account = accounts.find((a) => a.id === inv.account_id)
          return (
            <div key={inv.id} className="flex items-center justify-between py-2.5">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-zinc-900 truncate">
                  {inv.name}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {account?.name ?? 'Cuenta eliminada'} · {formatInvestmentDate(inv.date)}
                </p>
              </div>
              <span className="text-[13px] font-semibold text-zinc-900 tabular-nums shrink-0 ml-3">
                {formatAssetAmount(inv.amount, inv.currency)}
              </span>
            </div>
          )
        })}
      </div>

      {investments.length > 5 && (
        <p className="text-[10px] text-center text-zinc-400 mt-3 font-medium">
          +{investments.length - 5} inversiones más
        </p>
      )}
    </div>
  )
}