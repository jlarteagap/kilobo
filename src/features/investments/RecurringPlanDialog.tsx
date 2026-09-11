"use client"

import { useState } from "react"
import { RefreshCw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { Investment } from "@/types/investment"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { WEEKDAYS, formatWeekdayLong } from "./utils/recurrence.utils"
import { useSaveRecurringBuy, useDeleteRecurringBuy } from "./hooks/useInvestments"

interface RecurringPlanDialogProps {
  investment: Investment
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecurringPlanDialog({ investment, open, onOpenChange }: RecurringPlanDialogProps) {
  const saveRecurring = useSaveRecurringBuy()
  const deleteRecurring = useDeleteRecurringBuy()

  const initialPlan = investment.recurrence
  const [enabled, setEnabled] = useState(initialPlan?.enabled ?? false)
  const [dayOfWeek, setDayOfWeek] = useState(initialPlan?.day_of_week ?? 0)
  const [amount, setAmount] = useState<number>(initialPlan?.amount ?? 0)

  const pending = saveRecurring.isPending || deleteRecurring.isPending

  const handleSave = () => {
    saveRecurring.mutate(
      { investmentId: investment.id, data: { enabled, day_of_week: dayOfWeek, amount } },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  const handleDelete = () => {
    deleteRecurring.mutate(investment.id, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[22px] border border-zinc-200 p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-zinc-900 tracking-tight">
            Compra recurrente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 text-zinc-500" />
              <p className="text-[13px] font-semibold text-zinc-900 truncate">
                {investment.name}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={cn(
                "relative w-8 h-5 rounded-full transition-colors",
                enabled ? "bg-zinc-900" : "bg-zinc-200"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                  enabled && "translate-x-3"
                )}
              />
            </button>
          </div>

          {enabled && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide mb-1 block">
                    Día de la semana
                  </label>
                  <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(+v)}>
                    <SelectTrigger className="rounded-xl bg-white border-zinc-200 h-9 text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map(({ value, label }) => (
                        <SelectItem key={value} value={String(value)}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide mb-1 block">
                    Monto ({investment.currency})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount === 0 ? '' : amount}
                    onChange={(e) => setAmount(+e.target.value)}
                    className="rounded-xl bg-white border-zinc-200 h-9 text-[12px]"
                  />
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Compra semanal de {formatCurrency(amount, investment.currency)} los{' '}
                {formatWeekdayLong(dayOfWeek)}. Cuando venza, confírmala desde la lista.
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={pending || amount <= 0}
                  className="h-9 flex-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold"
                >
                  Guardar plan
                </Button>
                {initialPlan && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                    disabled={pending}
                    className="h-9 rounded-lg border-zinc-200 text-[11px] font-bold"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Quitar
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}