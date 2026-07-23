"use client"

import { useForm } from "react-hook-form"
import { createZodResolver } from "@/lib/validations/rhf-resolver"
import { SubmitButton } from "@/components/ui/submit-button"

import {
  createInvestmentSchema,
  CreateInvestmentInput,
} from "@/lib/validations/investment.schema"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Account, CURRENCY_TYPES } from "@/types/account"
import { Investment } from "@/types/investment"
import { getLocalDateString } from "@/utils/date.utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"

interface InvestmentFormProps {
  accounts: Account[]
  initialData?: Investment
  preselectedAccountId?: string
  onSubmit: (data: CreateInvestmentInput) => void
  onCancel: () => void
  isPending: boolean
}

export function InvestmentForm({
  accounts,
  initialData,
  preselectedAccountId,
  onSubmit,
  onCancel,
  isPending,
}: InvestmentFormProps) {
  const isEdit = !!initialData

  const preselectedAccount = accounts.find((a) => a.id === preselectedAccountId)

  const form = useForm<CreateInvestmentInput>({
    resolver: createZodResolver(createInvestmentSchema),
    defaultValues: {
      account_id: initialData?.account_id ?? preselectedAccountId ?? '',
      name:       initialData?.name ?? '',
      amount:     initialData?.amount ?? 0,
      units:      initialData?.units ?? null,
      unit_price: initialData?.unit_price ?? null,
      currency:   initialData?.currency ?? preselectedAccount?.currency ?? 'BOB',
      date:       initialData?.date ?? getLocalDateString(),
      notes:      initialData?.notes ?? null,
    },
  })

  const hasUnits = form.watch('units') && form.watch('unit_price')
  const unitsVal = form.watch('units') || 0
  const priceVal = form.watch('unit_price') || 0
  const calculatedAmount = hasUnits ? unitsVal * priceVal : form.watch('amount')
  const showAmountInput = !isEdit && !(form.watch('units') && form.watch('unit_price'))

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Cuenta
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!!preselectedAccountId || isEdit}
              >
                <FormControl>
                  <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:ring-gray-900/10">
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Nombre de la inversión
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: BTC, Fondo indexado..."
                  {...field}
                  className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="units"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Unidades
                  <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Ej: 0.5"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? +e.target.value : null)}
                    className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
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
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Precio/unit
                  <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? +e.target.value : null)}
                    className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                  />
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />
        </div>

        {hasUnits ? (
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/20 px-4 py-3 flex items-center justify-between">
            <span className="text-[13px] font-medium text-indigo-700 dark:text-indigo-300">
              Total invertido
            </span>
            <span className="text-[15px] font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {formatCurrency(calculatedAmount as number, form.watch('currency') || 'BOB')}
            </span>
          </div>
        ) : showAmountInput ? (
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Monto invertido
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(+e.target.value)}
                    className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                  />
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Fecha
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                  />
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Moneda
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value as string}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl border-0 bg-gray-50 focus:ring-gray-900/10">
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCY_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Notas
                <span className="text-gray-400 font-normal ml-1">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Detalles adicionales..."
                  {...field}
                  value={field.value ?? ''}
                  className="rounded-xl border-0 bg-gray-50 resize-none focus-visible:ring-gray-900/10"
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
            {isEdit ? 'Guardar cambios' : 'Registrar inversión'}
          </SubmitButton>
        </div>
      </form>
    </Form>
  )
}
