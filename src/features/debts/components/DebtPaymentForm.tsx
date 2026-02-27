// features/debts/components/DebtPaymentForm.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { useRegisterPayment } from "@/features/debts/hooks/useDebts"
import {
  createDebtPaymentSchema,
  CreateDebtPaymentInput,
} from "@/lib/validations/debt.schema"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"

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
import type { Debt } from "@/types/debt"

// ─── Barra de progreso ────────────────────────────────────────────────────────
function PaymentProgress({ debt }: { debt: Debt }) {
  const percent    = Math.min((debt.paid_amount / debt.amount) * 100, 100)
  const pending    = debt.amount - debt.paid_amount
  const isComplete = percent >= 100

  return (
    <div className="p-4 bg-gray-50 rounded-xl space-y-3">
      {/* Números */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-gray-400">Pagado</p>
          <p className="text-sm font-semibold text-gray-800">
            {formatCurrency(debt.paid_amount, debt.currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400">Pendiente</p>
          <p className={cn(
            'text-sm font-semibold',
            isComplete ? 'text-emerald-600' : 'text-rose-500'
          )}>
            {isComplete ? '¡Pagado!' : formatCurrency(pending, debt.currency)}
          </p>
        </div>
      </div>

      {/* Barra */}
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isComplete ? 'bg-emerald-400' : 'bg-gray-900'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Porcentaje */}
      <p className="text-[11px] text-gray-400 text-right">
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
  const { data: accounts = [] } = useAccounts()
  const registerPayment         = useRegisterPayment()

  const pending = debt.amount - debt.paid_amount

  const form = useForm<CreateDebtPaymentInput>({
    resolver: zodResolver(createDebtPaymentSchema) as any,
    defaultValues: {
      amount:     pending,  // ← por defecto el total pendiente
      account_id: debt.account_id,  // ← por defecto la cuenta original
      notes:      '',
      date:       new Date().toISOString().split('T')[0],
    },
  })

  const amount    = form.watch('amount') ?? 0
  const accountId = form.watch('account_id')
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
        <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-800 truncate">
              {debt.contact_name}
            </p>
            <p className="text-[11px] text-gray-400">
              {debt.type === 'GIVEN' ? 'Te debe' : 'Le debes'}
            </p>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(debt.amount, debt.currency)}
          </p>
        </div>

        {/* ── Progreso de pagos ── */}
        <PaymentProgress debt={debt} />

        {/* ── Monto del pago ── */}
        <FormField
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
                  className={cn(
                    'rounded-xl border-0 focus-visible:ring-gray-900/10',
                    isOverAmount ? 'bg-rose-50' : 'bg-gray-50'
                  )}
                />
              </FormControl>
              {isOverAmount && (
                <p className="text-[12px] text-rose-500 mt-1">
                  El monto supera el pendiente de {formatCurrency(pending, debt.currency)}
                </p>
              )}
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Fecha ── */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                Fecha del pago
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

        {/* ── Cuenta ── */}
        <FormField
          control={form.control}
          name="account_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-gray-600">
                {debt.type === 'GIVEN' ? 'Cuenta destino' : 'Cuenta origen'}
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
              {/* Balance hint para RECEIVED */}
              {debt.type === 'RECEIVED' && account && (
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

        {/* ── Notas ── */}
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
                  placeholder="Ej: Pago parcial de febrero…"
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
          disabled={registerPayment.isPending || isOverAmount}
          className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {registerPayment.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
            : `Registrar pago de ${formatCurrency(amount || 0, debt.currency)}`
          }
        </Button>
      </form>
    </Form>
  )
}