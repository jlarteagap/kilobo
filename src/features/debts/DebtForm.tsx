// features/debts/DebtForm.tsx
"use client"

import { useForm, useWatch } from "react-hook-form"
import { createZodResolver } from "@/lib/validations/rhf-resolver"
import { cn } from "@/lib/utils"
import { SubmitButton } from "@/components/ui/submit-button"

import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { useCreateDebt } from "@/features/debts/hooks/useDebts"
import {
  createDebtSchema,
  CreateDebtInput,
} from "@/lib/validations/debt.schema"
import { CURRENCY_TYPES } from "@/types/account"
import { AccountBalanceHint } from "@/components/ui/account-balance-hint"

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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Labels ───────────────────────────────────────────────────────────────────
const DEBT_TYPE_CONFIG = {
  GIVEN: {
    label:       'Presté dinero',
    description: 'Dinero que le diste a alguien y te deben devolver',
    emoji:       '💸',
  },
  RECEIVED: {
    label:       'Me prestaron',
    description: 'Dinero que recibiste y debes devolver',
    emoji:       '🤝',
  },
} as const

// ─── Componente principal ─────────────────────────────────────────────────────
export function DebtForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: accounts = [] } = useAccounts()
  const createDebt              = useCreateDebt()

  const form = useForm<CreateDebtInput>({
    resolver: createZodResolver(createDebtSchema),
    defaultValues: {
      type:         'GIVEN',
      contact_name: '',
      amount:       0,
      currency:     'BOB',
      account_id:   '',
      description:  '',
      is_legacy:    false,
    },
  })

  const type      = useWatch({ control: form.control, name: 'type' })
  const accountId = useWatch({ control: form.control, name: 'account_id' })
  const amount    = useWatch({ control: form.control, name: 'amount' }) ?? 0

  const onSubmit = async (data: CreateDebtInput) => {
    await createDebt.mutateAsync(data, {
      onSuccess: () => {
        form.reset()
        onSuccess()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Tipo — GIVEN / RECEIVED ── */}
        <FormField<CreateDebtInput>
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Tipo de deuda
              </FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(DEBT_TYPE_CONFIG) as [keyof typeof DEBT_TYPE_CONFIG, typeof DEBT_TYPE_CONFIG[keyof typeof DEBT_TYPE_CONFIG]][]).map(
                    ([value, config]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        className={cn(
                          'flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-200',
                          field.value === value
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-white'
                        )}
                      >
                        <span className="text-lg">{config.emoji}</span>
                        <span className="text-[13px] font-semibold">
                          {config.label}
                        </span>
                        <span className={cn(
                          'text-[11px] leading-tight',
                          field.value === value ? 'text-gray-300' : 'text-gray-400'
                        )}>
                          {config.description}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Nombre del contacto ── */}
        <FormField<CreateDebtInput>
          control={form.control}
          name="contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                {type === 'GIVEN' ? '¿A quién le prestaste?' : '¿Quién te prestó?'}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre de la persona"
                  value={field.value as string}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Monto + Moneda ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField<CreateDebtInput>
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Monto
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={field.value as number}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                  />
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />

          <FormField<CreateDebtInput>
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-gray-600">
                  Moneda
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value as string}>
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

        {/* ── Cuenta ── */}
        <FormField<CreateDebtInput>
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                {type === 'GIVEN' ? 'Cuenta origen' : 'Cuenta destino'}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value as string}>
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

        {type === 'GIVEN' && (
          <AccountBalanceHint
            accountId={accountId}
            amount={amount}
            accounts={accounts}
            showBalance
          />
        )}

        {/* ── Deuda previa ── */}
        <FormField<CreateDebtInput>
          control={form.control}
          name="is_legacy"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <FormControl>
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    className="mt-0.5 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                  />
                </FormControl>
                <div className="space-y-0.5">
                  <FormLabel className="text-[13px] font-medium text-gray-700 cursor-pointer">
                    Es una deuda previa
                  </FormLabel>
                  <p className="text-[12px] text-gray-400 leading-relaxed">
                    Registra una deuda que ya existía antes. No afectará el saldo de tu cuenta ni aparecerá en transacciones.
                  </p>
                </div>
              </div>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Descripción ── */}
        <FormField<CreateDebtInput>
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Descripción
                <span className="text-gray-400 font-normal ml-1">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Motivo del préstamo…"
                  value={field.value as string}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="rounded-xl border-0 bg-gray-50 resize-none focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        <SubmitButton isPending={createDebt.isPending}>
          Registrar deuda
        </SubmitButton>
      </form>
    </Form>
  )
}