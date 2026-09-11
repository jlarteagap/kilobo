"use client"

import type { Investment } from "@/types/investment"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/ui/submit-button"
import { RefreshCw } from "lucide-react"

import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { getLocalDateString } from "@/utils/date.utils"
import { formatWeekdayLong } from "./utils/recurrence.utils"
import { useExecuteRecurringBuy } from "./hooks/useInvestments"

interface ConfirmRecurringBuyDialogProps {
  investment: Investment | null
  onClose: () => void
}

export function ConfirmRecurringBuyDialog({ investment, onClose }: ConfirmRecurringBuyDialogProps) {
  const execute = useExecuteRecurringBuy(investment?.id ?? "")
  const plan = investment?.recurrence

  const handleConfirm = () => {
    execute.mutate({ date: getLocalDateString() }, { onSuccess: onClose })
  }

  return (
    <Dialog open={!!investment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[22px] border border-zinc-200 p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-zinc-900 tracking-tight">
            Confirmar compra
          </DialogTitle>
        </DialogHeader>
        {investment && plan && (
          <div className="space-y-5">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-zinc-900 truncate">
                  {investment.name}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {formatWeekdayLong(plan.day_of_week)}
                </p>
              </div>
              <span className="text-[13px] font-bold text-zinc-900 tabular-nums shrink-0 ml-3">
                {formatCurrency(plan.amount, plan.currency)}
              </span>
            </div>

            <p className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[12px] leading-relaxed text-zinc-600">
              <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
              Se registrará una compra de {formatCurrency(plan.amount, plan.currency)} desde
              la cuenta vinculada al plan.
            </p>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={execute.isPending}
                className="flex-1 rounded-xl border-zinc-200"
              >
                Cancelar
              </Button>
              <SubmitButton
                isPending={execute.isPending}
                className="flex-1 rounded-xl bg-zinc-900 hover:bg-zinc-800"
                onClick={handleConfirm}
              >
                Confirmar compra
              </SubmitButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}