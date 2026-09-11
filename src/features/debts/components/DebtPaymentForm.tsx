// features/debts/components/DebtPaymentForm.tsx
"use client"

import { useForm, useWatch } from "react-hook-form"
import { createZodResolver } from "@/lib/validations/rhf-resolver"
import { cn } from "@/lib/utils"
import { SubmitButton } from "@/components/ui/submit-button"

import { useActiveAccounts } from "@/features/accounts/hooks/useAccounts"
import { useRegisterPayment } from "@/features/debts/hooks/useDebts"
import {
  createDebtPaymentSchema,
  CreateDebtPaymentInput,
} from "@/lib/validations/debt.schema"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { getLocalDateString } from "@/utils/date.utils"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Debt } from "@/types/debt"

// ─── Barra de progreso ────────────────────────────────────────────────────────
function PaymentProgress({ debt }: { debt: Debt }) {
  const percent    = Math.min((debt.paid_amount / debt.amount) * 100, 100)
  const pending    = debt.amount - debt.paid_amount
  const isComplete = percent >= 100

  return (
    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
      {/* Números */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-zinc-500">Pagado</p>
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(debt.paid_amount, debt.currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-zinc-500">Pendiente</p>
          <p className={cn(
            'text-sm font-semibold',
            isComplete ? 'text-emerald-600' : 'text-[#B5543D]'
          )}>
            {isComplete ? '¡Pagado!' : formatCurrency(pending, debt.currency)}
          </p>
        </div>
      </div>

      {/* Barra */}
      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isComplete ? 'bg-emerald-600' : 'bg-zinc-900'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Porcentaje */}
      <p className="text-[11px] text-zinc-500 text-right">
        {percent.toFixed(0)}% completado
        {' · '}Total: {formatCurrency(debt.amount, debt.currency)}
      </p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
interface DebtPaymentFormProps {
  debt:      Debt
  onSuccess: () => void
}

export function DebtPaymentForm({ debt, onSuccess }: DebtPaymentFormProps) {
  const { data: accounts = [] } = useActiveAccounts()
  const registerPayment         = useRegisterPayment()

  const pending = debt.amount - debt.paid_amount

  const form = useForm<CreateDebtPaymentInput>({
    resolver: createZodResolver(createDebtPaymentSchema),
    defaultValues: {
      amount:     pending,  // ← por defecto el total pendiente
      account_id: debt.account_id,  // ← por defecto la cuenta original
      notes:      '',
      date:       getLocalDateString(),
    },
  })

  const amount    = useWatch({ control: form.control, name: 'amount' }) ?? 0
  const accountId = useWatch({ control: form.control, name: 'account_id' })
  const account   = accounts.find((a) => a.id === accountId)

  // Validación visual — pago supera pendiente
  const isOverAmount  = amount > pending
  // Para RECEIVED — verificar que hay balance suficiente
  const isOverBalance = debt.type === 'RECEIVED' && account
    ? amount > account.balance
    : false

  const onSubmit = async (data: CreateDebtPaymentInput) => {
    await registerPayment.mutateAsync(
      { debtId: debt.id, data },
      {
        onSuccess: () => {
          form.reset()
          onSuccess()
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Resumen de la deuda ── */}
        <div className="flex items-center gap-3 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">
              {debt.contact_name}
            </p>
            <p className="text-[11px] text-zinc-500">
              {debt.type === 'GIVEN' ? 'Te debe' : 'Le debes'}
            </p>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(debt.amount, debt.currency)}
          </p>
        </div>

        {/* ── Progreso de pagos ── */}
        <PaymentProgress debt={debt} />

        {/* ── Monto del pago ── */}
        <FormField<CreateDebtPaymentInput>
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-foreground">
                Monto a pagar
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  className={cn(
                    'rounded-xl bg-white border border-zinc-200 focus-visible:ring-zinc-400/30',
                    isOverAmount ? 'bg-[#FAEDE9] border-[#FAEDE9]' : ''
                  )}
                  value={typeof field.value === 'number' || typeof field.value === 'string' ? field.value : ''}
                />
              </FormControl>
              {isOverAmount && (
                <p className="text-[12px] text-[#B5543D] mt-1">
                  El monto supera el pendiente de {formatCurrency(pending, debt.currency)}
                </p>
              )}
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Fecha ── */}
        <FormField<CreateDebtPaymentInput>
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-foreground">
                Fecha del pago
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  className="rounded-xl bg-white border border-zinc-200 focus-visible:ring-zinc-400/30"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Cuenta ── */}
        <FormField<CreateDebtPaymentInput>
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-foreground">
                {debt.type === 'GIVEN' ? 'Cuenta destino' : 'Cuenta origen'}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                <FormControl>
                  <SelectTrigger className="rounded-xl bg-white border border-zinc-200 focus:ring-zinc-400/30">
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
              {/* Balance hint para RECEIVED */}
              {debt.type === 'RECEIVED' && account && (
                <div className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-[12px] mt-2',
                  isOverBalance ? 'bg-[#FAEDE9] text-[#B5543D]' : 'bg-zinc-50 text-zinc-500 border border-zinc-200'
                )}>
                  <span>Balance disponible</span>
                  <span className={cn('font-semibold', isOverBalance && 'text-[#B5543D]')}>
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

        {/* ── Notas ── */}
        <FormField<CreateDebtPaymentInput>
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-foreground">
                Notas
                <span className="text-zinc-500 font-normal ml-1">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Ej: Pago parcial de febrero…"
                  {...field}
                  value={field.value ?? ''}
                  className="rounded-xl bg-white border border-zinc-200 resize-none focus-visible:ring-zinc-400/30"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        <SubmitButton
          isPending={registerPayment.isPending}
          disabled={isOverAmount}
        >
          {`Registrar pago de ${formatCurrency(amount || 0, debt.currency)}`}
        </SubmitButton>
      </form>
    </Form>
  )
}