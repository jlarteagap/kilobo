"use client"

import { useForm, useWatch } from "react-hook-form"
import { createZodResolver } from "@/lib/validations/rhf-resolver"
import { executeRecurringBuySchema } from "@/lib/validations/investment.schema"
import type { ExecuteRecurringBuyInput } from "@/lib/validations/investment.schema"
import type { Investment } from "@/types/investment"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/ui/submit-button"

import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { formatWeekdayLong } from "./utils/recurrence.utils"
import { useExecuteRecurringBuy } from "./hooks/useInvestments"

interface ConfirmRecurringBuyDialogProps {
  investment: Investment | null
  onClose: () => void
}

export function ConfirmRecurringBuyDialog({ investment, onClose }: ConfirmRecurringBuyDialogProps) {
  const execute = useExecuteRecurringBuy(investment?.id ?? "")

  const form = useForm<ExecuteRecurringBuyInput>({
    resolver: createZodResolver(executeRecurringBuySchema),
    defaultValues: { unit_price: 0 },
  })

  const price = useWatch({ control: form.control, name: "unit_price" }) || 0
  const plan = investment?.recurrence
  const units = plan && price > 0 ? plan.amount / price : 0

  const handleSubmit = (data: ExecuteRecurringBuyInput) => {
    execute.mutate(data, { onSuccess: onClose })
  }

  return (
    <Dialog open={!!investment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[22px] border-none p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">
            Confirmar compra
          </DialogTitle>
        </DialogHeader>
        {investment && plan && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              <div className="rounded-xl bg-[#F2F9E3]/40 px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {investment.name}
                  </p>
                  <p className="text-[11px] text-[#6E6E73] mt-0.5">
                    {formatWeekdayLong(plan.day_of_week)} · {formatCurrency(plan.amount, plan.currency)}
                  </p>
                </div>
                <span className="text-[13px] font-bold text-[#4F6A35] tabular-nums shrink-0 ml-3">
                  {formatCurrency(plan.amount, plan.currency)}
                </span>
              </div>

              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-foreground">
                      Precio del día
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(+e.target.value)}
                        className="rounded-xl border-0 bg-[#F2F9E3]/40 focus-visible:ring-[#5F7D42]/30"
                      />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />

              <div className="rounded-xl bg-indigo-50 px-4 py-3 flex items-center justify-between">
                <span className="text-[13px] font-medium text-indigo-700">
                  Unidades a comprar
                </span>
                <span className="text-[15px] font-bold text-indigo-600 tabular-nums">
                  {units > 0 ? new Intl.NumberFormat("es-BO", { maximumFractionDigits: 8 }).format(units) : '—'}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={execute.isPending}
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
                <SubmitButton isPending={execute.isPending} className="flex-1">
                  Confirmar compra
                </SubmitButton>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}