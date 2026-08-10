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

export function InvestmentTxForm({
  investment,
  type,
  onSubmit,
  onCancel,
  isPending,
}: InvestmentTxFormProps) {
  const isBuy = type === 'BUY'
  const schema = isBuy ? buyInvestmentSchema : sellInvestmentSchema
  const availableUnits = investment.units ?? 0

  const form = useForm<BuyInvestmentInput | SellInvestmentInput>({
    resolver: createZodResolver(schema),
    defaultValues: {
      investment_id: investment.id,
      account_id: investment.account_id,
      units: 0,
      unit_price: 0,
      currency: investment.currency,
      date: getLocalDateString(),
      notes: null,
    } as BuyInvestmentInput | SellInvestmentInput,
  })

  const units = form.watch('units') || 0
  const unitPrice = form.watch('unit_price') || 0
  const total = units * unitPrice

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-xl bg-[#F2F9E3]/40 px-4 py-3 space-y-1">
          <p className="text-[13px] font-semibold text-foreground">
            {investment.name}
          </p>
          {investment.units != null && (
            <p className="text-[11px] text-[#6E6E73]">
              En cartera: {investment.units} units · Precio promedio: {formatCurrency(investment.unit_price ?? 0, investment.currency)}/unit
            </p>
          )}
        </div>

        {!isBuy && (
          <div className="rounded-xl bg-amber-50 px-4 py-2 text-[12px] font-medium text-amber-700">
            Disponibles: {availableUnits} units
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="units"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-foreground">
                  Unidades
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step={investment.currency === 'BTC' || investment.currency === 'ETH' ? '0.000001' : '0.01'}
                    min="0"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(+e.target.value)}
                    className="rounded-xl border-0 bg-[#F2F9E3]/40 focus-visible:ring-[#5F7D42]/30"
                  />
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-foreground">
                  Precio por unidad
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
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
        </div>

        <div className="rounded-xl bg-indigo-50 px-4 py-3 flex items-center justify-between">
          <span className="text-[13px] font-medium text-indigo-700">
            Total
          </span>
          <span className="text-[15px] font-bold text-indigo-600 tabular-nums">
            {formatCurrency(total, investment.currency)}
          </span>
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-foreground">
                Fecha
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  className="rounded-xl border-0 bg-[#F2F9E3]/40 focus-visible:ring-[#5F7D42]/30"
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
              <FormLabel className="text-[13px] font-medium text-foreground">
                Notas <span className="text-[#6E6E73] font-normal">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Detalles adicionales..."
                  {...field}
                  value={field.value ?? ''}
                  className="rounded-xl border-0 bg-[#F2F9E3]/40 resize-none focus-visible:ring-[#5F7D42]/30"
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
            className="flex-1 rounded-xl"
          >
            Cancelar
          </Button>
          <SubmitButton isPending={isPending} className="flex-1">
            {isBuy ? 'Registrar Compra' : 'Registrar Venta'}
          </SubmitButton>
        </div>
      </form>
    </Form>
  )
}
