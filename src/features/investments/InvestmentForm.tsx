"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { createZodResolver } from "@/lib/validations/rhf-resolver"
import { SubmitButton } from "@/components/ui/submit-button"
import { RefreshCw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
import { WEEKDAYS, formatWeekdayLong } from "./utils/recurrence.utils"
import { useSaveRecurringBuy, useDeleteRecurringBuy } from "./hooks/useInvestments"

interface InvestmentFormProps {
  accounts: Account[]
  initialData?: Investment
  preselectedAccountId?: string
  onSubmit: (data: CreateInvestmentInput) => void
  onCancel: () => void
  isPending: boolean
}

function RecurringPlanSection({ initialData }: { initialData: Investment }) {
  const saveRecurring = useSaveRecurringBuy()
  const deleteRecurring = useDeleteRecurringBuy()

  const initialPlan = initialData.recurrence
  const [enabled, setEnabled] = useState(initialPlan?.enabled ?? false)
  const [dayOfWeek, setDayOfWeek] = useState(initialPlan?.day_of_week ?? 0)
  const [amount, setAmount] = useState<number>(initialPlan?.amount ?? 0)

  const hasPosition = initialData.units != null && initialData.unit_price != null

  if (!hasPosition) {
    return (
      <div className="rounded-xl bg-[rgba(0,0,0,0.03)] px-4 py-3 border border-dashed border-[rgba(0,0,0,0.12)]">
        <p className="text-[11px] font-medium text-[#6E6E73]">
          Para programar compras recurrentes, la inversión necesita tener posición (unidades y precio/unit).
        </p>
      </div>
    )
  }

  const pending = saveRecurring.isPending || deleteRecurring.isPending

  const handleSave = () => {
    saveRecurring.mutate({
      investmentId: initialData.id,
      data: {
        enabled,
        day_of_week: dayOfWeek,
        amount,
      },
    })
  }

  const handleDelete = () => {
    deleteRecurring.mutate(initialData.id)
  }

  return (
    <div className="rounded-xl border border-[rgba(0,0,0,0.08)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-[#5F7D42]" />
          <span className="text-[12px] font-bold text-foreground">Compra recurrente</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={cn(
            "relative w-8 h-5 rounded-full transition-colors",
            enabled ? "bg-[#5F7D42]" : "bg-[rgba(0,0,0,0.15)]"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
              enabled && "translate-x-3"
            )}
          />
        </button>
      </div>

      {enabled && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[#6E6E73] uppercase tracking-wide mb-1 block">
                Día de la semana
              </label>
              <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(+v)}>
                <SelectTrigger className="rounded-xl border-0 bg-[#F2F9E3]/40 focus:ring-[#5F7D42]/30 h-9 text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map(({ value, label }) => (
                    <SelectItem key={value} value={String(value)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#6E6E73] uppercase tracking-wide mb-1 block">
                Monto ({initialData.currency})
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(+e.target.value)}
                className="rounded-xl border-0 bg-[#F2F9E3]/40 focus-visible:ring-[#5F7D42]/30 h-9 text-[12px]"
              />
            </div>
          </div>
          <p className="text-[10px] text-[#6E6E73]">
            Compra semanal de {formatCurrency(amount, initialData.currency)} los {formatWeekdayLong(dayOfWeek)}.
            Cuando venza, confirma con el precio del día desde la lista.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={pending || amount <= 0}
              className="h-8 flex-1 rounded-lg bg-[#5F7D42] hover:bg-[#4F6A35] text-white text-[11px] font-bold"
            >
              Guardar plan
            </Button>
            {initialPlan && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDelete}
                disabled={pending}
                className="h-8 rounded-lg border-[rgba(0,0,0,0.08)] text-[11px] font-bold"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Quitar
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
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
              <FormLabel className="text-[13px] font-medium text-foreground">
                Cuenta
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!!preselectedAccountId || isEdit}
              >
                <FormControl>
                  <SelectTrigger className="rounded-xl border-0 bg-[#F2F9E3]/40 focus:ring-[#5F7D42]/30">
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
              <FormLabel className="text-[13px] font-medium text-foreground">
                Nombre de la inversión
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: BTC, Fondo indexado..."
                  {...field}
                  className="rounded-xl border-0 bg-[#F2F9E3]/40 focus-visible:ring-[#5F7D42]/30"
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
                <FormLabel className="text-[13px] font-medium text-foreground">
                  Unidades
                  <span className="text-[#6E6E73] font-normal ml-1">(opcional)</span>
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
                  Precio/unit
                  <span className="text-[#6E6E73] font-normal ml-1">(opcional)</span>
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
                    className="rounded-xl border-0 bg-[#F2F9E3]/40 focus-visible:ring-[#5F7D42]/30"
                  />
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />
        </div>

        {hasUnits ? (
          <div className="rounded-xl bg-indigo-50 px-4 py-3 flex items-center justify-between">
            <span className="text-[13px] font-medium text-indigo-700">
              Total invertido
            </span>
            <span className="text-[15px] font-bold text-indigo-600 tabular-nums">
              {formatCurrency(calculatedAmount as number, form.watch('currency') || 'BOB')}
            </span>
          </div>
        ) : showAmountInput ? (
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-foreground">
                  Monto invertido
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
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
        ) : null}

        <div className="grid grid-cols-2 gap-4">
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
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-foreground">
                  Moneda
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value as string}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl border-0 bg-[#F2F9E3]/40 focus:ring-[#5F7D42]/30">
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
              <FormLabel className="text-[13px] font-medium text-foreground">
                Notas
                <span className="text-[#6E6E73] font-normal ml-1">(opcional)</span>
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

        {isEdit && initialData && <RecurringPlanSection initialData={initialData} />}

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
