"use client"

import { useForm } from "react-hook-form"
import { createZodResolver } from "@/lib/validations/rhf-resolver"
import { SubmitButton } from "@/components/ui/submit-button"
import { ArrowDownUp } from "lucide-react"
import { useMemo } from "react"

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
import { useInvestments } from "./hooks/useInvestments"

interface InvestmentFormProps {
  accounts: Account[]
  initialData?: Investment
  preselectedAccountId?: string
  onSubmit: (data: CreateInvestmentInput) => void
  onCancel: () => void
  isPending: boolean
}

const inputClass = "rounded-xl bg-white border-zinc-200 focus-visible:ring-zinc-400/30"

export function InvestmentForm({
  accounts,
  initialData,
  preselectedAccountId,
  onSubmit,
  onCancel,
  isPending,
}: InvestmentFormProps) {
  const isEdit = !!initialData
  const { data: allInvestments = [] } = useInvestments()

  const preselectedAccount = accounts.find((a) => a.id === preselectedAccountId)

  const form = useForm<CreateInvestmentInput>({
    resolver: createZodResolver(createInvestmentSchema),
    defaultValues: {
      account_id: initialData?.account_id ?? preselectedAccountId ?? '',
      name:       initialData?.name ?? '',
      amount:     initialData?.amount ?? 0,
      currency:   initialData?.currency ?? preselectedAccount?.currency ?? 'BOB',
      date:       initialData?.date ?? getLocalDateString(),
      notes:      initialData?.notes ?? null,
    },
  })

  const [accountId, name] = form.watch(['account_id', 'name'])

  const existingMatch = useMemo(() => {
    if (isEdit || !accountId || !name || name.trim().length < 2) return null
    const normalized = name.trim().toLowerCase()
    return allInvestments.find(
      (inv) =>
        inv.account_id === accountId &&
        inv.name.trim().toLowerCase() === normalized
    ) ?? null
  }, [isEdit, accountId, name, allInvestments])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-zinc-900">
                Cuenta
              </FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value)
                  const account = accounts.find((a) => a.id === value)
                  if (account && !isEdit) form.setValue('currency', account.currency)
                }}
                value={field.value}
                disabled={!!preselectedAccountId || isEdit}
              >
                <FormControl>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} · {acc.currency}
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
              <FormLabel className="text-[13px] font-medium text-zinc-900">
                ¿Qué compraste?
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Apple, BTC, Banco BISA, Caja de ahorro..."
                  {...field}
                  className={inputClass}
                />
              </FormControl>
              {existingMatch && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <ArrowDownUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <p className="text-[11px] leading-relaxed text-emerald-700">
                    Ya tienes <span className="font-bold">"{existingMatch.name}"</span>{' '}
                    en esta cuenta ({formatCurrency(existingMatch.amount, existingMatch.currency)}).
                    Se agregará una compra a la posición existente.
                  </p>
                </div>
              )}
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-zinc-900">
                ¿Cuánto invertiste?
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-zinc-900">
                  ¿Cuándo?
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
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-zinc-900">
                  Moneda
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value as string}>
                  <FormControl>
                    <SelectTrigger className={inputClass}>
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
              <FormLabel className="text-[13px] font-medium text-zinc-900">
                Notas
                <span className="text-zinc-400 font-normal ml-1">(opcional)</span>
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
            {isEdit ? 'Guardar cambios' : existingMatch ? 'Sumar a inversión' : 'Registrar inversión'}
          </SubmitButton>
        </div>
      </form>
    </Form>
  )
}