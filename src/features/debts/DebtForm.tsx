// features/debts/DebtForm.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { useCreateDebt } from "@/features/debts/hooks/useDebts"
import {
  createDebtSchema,
  CreateDebtInput,
} from "@/lib/validations/debt.schema"
import { CURRENCY_TYPES } from "@/types/account"

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

// ─── Balance hint ─────────────────────────────────────────────────────────────
function AccountBalanceHint({
  accountId,
  amount,
  type,
  accounts,
}: {
  accountId: string | undefined
  amount:    number
  type:      'GIVEN' | 'RECEIVED'
  accounts:  { id: string; name: string; balance: number; currency: string }[]
}) {
  if (!accountId) return null
  const account = accounts.find((a) => a.id === accountId)
  if (!account) return null

  const isOverdraft = type === 'GIVEN' && amount > account.balance

  return (
    <div className={cn(
      'flex items-center justify-between px-3 py-2 rounded-xl text-[12px] transition-all duration-200',
      isOverdraft ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-400'
    )}>
      <span>Balance disponible</span>
      <span className={cn('font-semibold', isOverdraft && 'text-rose-600')}>
        {account.balance} {account.currency}
        {isOverdraft ? <span className="ml-1.5 font-normal">· insuficiente</span> : null}
      </span>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function DebtForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: accounts = [] } = useAccounts()
  const createDebt              = useCreateDebt()

  const form = useForm<CreateDebtInput>({
    resolver: zodResolver(createDebtSchema) as any,
    defaultValues: {
      type:         'GIVEN',
      contact_name: '',
      amount:       0,
      currency:     'BOB',
      account_id:   '',
      description:  '',
    },
  })

  const type      = form.watch('type')
  const accountId = form.watch('account_id')
  const amount    = form.watch('amount') ?? 0

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
        <FormField
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
        <FormField
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
                  {...field}
                  className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Monto + Moneda ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                {type === 'GIVEN' ? 'Cuenta origen' : 'Cuenta destino'}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        {/* ── Balance hint ── */}
        <AccountBalanceHint
          accountId={accountId}
          amount={amount}
          type={type}
          accounts={accounts}
        />

        {/* ── Descripción ── */}
        <FormField
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
                  {...field}
                  value={field.value ?? ''}
                  className="rounded-xl border-0 bg-gray-50 resize-none focus-visible:ring-gray-900/10"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Submit ── */}
        <Button
          type="submit"
          disabled={createDebt.isPending}
          className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {createDebt.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
            : 'Registrar deuda'
          }
        </Button>
      </form>
    </Form>
  )
}