"use client"

import { useState } from "react"
import { RefreshCw, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ConfirmRecurringBuyDialog } from "../ConfirmRecurringBuyDialog"
import { isPlanDue, nextDueString, formatWeekdayShort } from "../utils/recurrence.utils"
import { formatInvestmentDate } from "../utils/investment-display.utils"
import { formatAssetAmount } from "@/features/accounts/utils/account-display.utils"
import type { Investment } from "@/types/investment"

export function UpcomingPurchases({ investments }: { investments: Investment[] }) {
  const [confirmInvestment, setConfirmInvestment] = useState<Investment | null>(null)

  const activePlans = investments
    .filter((inv) => inv.recurrence?.enabled)
    .map((inv) => ({
      investment: inv,
      plan: inv.recurrence!,
      due: isPlanDue(inv.recurrence!, new Date()),
      date: inv.recurrence!.next_due ?? nextDueString(new Date(), inv.recurrence!.day_of_week),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (activePlans.length === 0) {
    if (investments.length === 0) return null
    return (
      <div className="bg-white rounded-[22px] border border-zinc-200">
        <div className="flex items-center gap-2 px-5 py-3 bg-zinc-50/80 border-b border-zinc-100 rounded-t-[22px]">
          <CalendarClock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[12px] font-semibold text-zinc-500">
            Programa compras recurrentes semanales desde el botón de cada inversión
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-[22px] border border-zinc-200">
        <div className="flex items-center justify-between px-5 py-4 bg-zinc-50/80 border-b border-zinc-100 rounded-t-[22px]">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
            <h3 className="text-[13px] font-semibold text-zinc-900">Próximas compras</h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-zinc-500">
            {activePlans.length} plan{activePlans.length !== 1 ? 'es' : ''}
          </span>
        </div>
        <div className="divide-y divide-zinc-100">
          {activePlans.map(({ investment, plan, due, date }) => (
            <div key={investment.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-zinc-900 truncate">{investment.name}</p>
                <p className={cn("text-[11px] mt-0.5", due ? "text-red-500 font-semibold" : "text-zinc-500")}>
                  {due ? 'Pendiente' : 'Próxima'} · {formatInvestmentDate(date)} · {formatWeekdayShort(plan.day_of_week)}
                </p>
              </div>
              <span className="text-[13px] font-bold text-zinc-900 tabular-nums shrink-0 ml-2">
                {formatAssetAmount(plan.amount, plan.currency)}
              </span>
              {due && (
                <Button
                  size="sm"
                  onClick={() => setConfirmInvestment(investment)}
                  className="h-7 text-[11px] rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white shrink-0"
                >
                  Confirmar
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <ConfirmRecurringBuyDialog
        investment={confirmInvestment}
        onClose={() => setConfirmInvestment(null)}
      />
    </>
  )
}