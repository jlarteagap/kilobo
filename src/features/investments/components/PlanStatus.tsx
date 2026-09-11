"use client"

import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { isPlanDue, nextDueString, formatWeekdayShort } from "../utils/recurrence.utils"
import { formatInvestmentDate } from "../utils/investment-display.utils"
import { formatAssetAmount } from "@/features/accounts/utils/account-display.utils"
import type { Investment } from "@/types/investment"

export function PlanStatus({ investment }: { investment: Investment }) {
  const plan = investment.recurrence
  if (!plan) return null

  const today = new Date()
  const due = isPlanDue(plan, today)
  const nextDate = plan.next_due ?? nextDueString(today, plan.day_of_week)

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
      {plan.enabled ? (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
          <RefreshCw className="w-2.5 h-2.5" />
          Plan · {formatWeekdayShort(plan.day_of_week)} · {formatAssetAmount(plan.amount, plan.currency)}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-50 text-zinc-400 border border-zinc-200">
          Plan pausado
        </span>
      )}
      {plan.enabled && (
        <span className={cn("text-[10px] font-semibold", due ? "text-red-500" : "text-zinc-500")}>
          {due ? 'Pendiente' : 'Próxima'} · {formatInvestmentDate(nextDate)}
        </span>
      )}
    </div>
  )
}