"use client"

import { useForm } from "react-hook-form"
import { createZodResolver } from "@/lib/validations/rhf-resolver"
import {
  buyInvestmentSchema,
  sellInvestmentSchema,
  BuyInvestmentInput,
  SellInvestmentInput,
} from "@/lib/validations/investment.schema"
import type { Investment, InvestmentTxType } from "@/types/investment"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/ui/submit-button"

import { getLocalDateString } from "@/utils/date.utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"

interface InvestmentTxFormProps {
  investment: Investment
  type: InvestmentTxType
  onSubmit: (data: BuyInvestmentInput | SellInvestmentInput) => void
  onCancel: () => void
  isPending: boolean
}

const inputClass = "rounded-xl bg-white border-zinc-200 focus-visible:ring-zinc-400/30"

export function InvestmentTxForm({
  investment,
  type,
  onSubmit,
  onCancel,
  isPending,
}: InvestmentTxFormProps) {
  const isBuy = type === 'BUY'
  const schema = isBuy ? buyInvestmentSchema : sellInvestmentSchema
  const available = investment.amount

  const form = useForm<BuyInvestmentInput | SellInvestmentInput>({
    resolver: createZodResolver(schema),
    defaultValues: {
      investment_id: investment.id,
      account_id: investment.account_id,
      amount: 0,
      currency: investment.currency,
      date: getLocalDateString(),
      notes: null,
    } as BuyInvestmentInput | SellInvestmentInput,
  })

  const amount = form.watch('amount') || 0

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 space-y-1">
          <p className="text-[13px] font-semibold text-zinc-900">
            {investment.name}
          </p>
          <p className="text-[11px] text-zinc-500">
            Total invertido: {formatCurrency(available, investment.currency)}
          </p>
        </div>

        {!isBuy && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-[12px] font-medium text-amber-700">
            Disponible para vender: {formatCurrency(available, investment.currency)}
          </div>
        )}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-zinc-900">
                {isBuy ? '¿Cuánto compraste?' : '¿Cuánto vendiste?'}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={field.value === 0 ? '' : field.value}
                  onChange={(e) => field.onChange(+e.target.value)}
                  className={inputClass}
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 flex items-center justify-between">
          <span className="text-[13px] font-medium text-zinc-600">
            Total
          </span>
          <span className="text-[15px] font-bold text-zinc-900 tabular-nums">
            {formatCurrency(amount, investment.currency)}
          </span>
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-zinc-900">
                Fecha
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  className={inputClass}
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-zinc-900">
                Notas <span className="text-zinc-400 font-normal">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Detalles adicionales..."
                  {...field}
                  value={field.value ?? ''}
                  className={`${inputClass} resize-none`}
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl border-zinc-200"
          >
            Cancelar
          </Button>
          <SubmitButton
            isPending={isPending}
            className="flex-1 rounded-xl bg-zinc-900 hover:bg-zinc-800"
          >
            {isBuy ? 'Registrar Compra' : 'Registrar Venta'}
          </SubmitButton>
        </div>
      </form>
    </Form>
  )
}