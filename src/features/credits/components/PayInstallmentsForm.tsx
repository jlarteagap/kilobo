"use client"

import { useForm, useWatch } from "react-hook-form"
import { createZodResolver } from "@/lib/validations/rhf-resolver"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SubmitButton } from "@/components/ui/submit-button"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { payInstallmentsSchema, type PayInstallmentsInput } from "@/lib/validations/credit.schema"
import { usePayInstallments } from "@/features/credits/hooks/useCredits"
import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { cn } from "@/lib/utils"
import type { Credit, Installment } from "@/types/credit"

interface PayInstallmentsFormProps {
  credit:      Credit
  installment: Installment
  onSuccess:   () => void
}

export function PayInstallmentsForm({
  credit,
  installment,
  onSuccess,
}: PayInstallmentsFormProps) {
  const { data: accounts = [] } = useAccounts()
  const { mutateAsync: payInstallments, isPending } = usePayInstallments()

  const form = useForm<PayInstallmentsInput>({
    resolver: createZodResolver(payInstallmentsSchema),
    defaultValues: {
      installment_ids: [installment.id],
      amount:          installment.total_amount,
      account_id:      credit.account_id ?? '',
    },
  })

  const amount     = useWatch({ control: form.control, name: 'amount' }) ?? 0
  const accountId  = useWatch({ control: form.control, name: 'account_id' })
  const account    = accounts.find((a) => a.id === accountId)

  const isOverBalance = account ? amount > account.balance : false

  const handleSubmit = async (data: PayInstallmentsInput) => {
    await payInstallments({ creditId: credit.id, data })
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

        {/* ── Resumen de la cuota ── */}
        <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-800 truncate">
              {credit.institution}
            </p>
            <p className="text-[11px] text-gray-400">
              Cuota #{installment.number} · {formatCurrency(installment.total_amount, credit.currency)}
            </p>
          </div>
        </div>

        {/* ── Monto a pagar ── */}
        <FormField<PayInstallmentsInput>
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Monto a pagar
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Cuenta origen ── */}
        <FormField<PayInstallmentsInput>
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Cuenta origen
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value as string}
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
              {/* Balance hint */}
              {account && (
                <div className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-[12px] mt-2',
                  isOverBalance ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-400'
                )}>
                  <span>Balance disponible</span>
                  <span className={cn('font-semibold', isOverBalance && 'text-rose-600')}>
                    {formatCurrency(account.balance, account.currency)}
                    {isOverBalance && (
                      <span className="ml-1.5 font-normal">· insuficiente</span>
                    )}
                  </span>
                </div>
              )}
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        <SubmitButton isPending={isPending}>
          Pagar cuota #{installment.number} — {formatCurrency(amount || installment.total_amount, credit.currency)}
        </SubmitButton>
      </form>
    </Form>
  )
}
