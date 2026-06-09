"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { createZodResolver } from "@/lib/validations/rhf-resolver"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/ui/submit-button"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { useCreateDebt } from "@/features/debts/hooks/useDebts"
import {
  createDebtSchema,
  CreateDebtInput,
} from "@/lib/validations/debt.schema"
import { CURRENCY_TYPES } from "@/types/account"
import { AccountBalanceHint } from "@/components/ui/account-balance-hint"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Step config ─────────────────────────────────────────────────────────
const STEPS = [
  { title: 'Tipo',   emoji: '🤝' },
  { title: 'Monto',  emoji: '💰' },
  { title: 'Cuenta', emoji: '🏦' },
] as const

const STEP_FIELDS: (keyof CreateDebtInput)[][] = [
  ['type', 'contact_name'],
  ['amount', 'currency', 'date'],
  ['account_id', 'is_legacy', 'description'],
]

// ─── Labels ──────────────────────────────────────────────────────────────
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

// ─── Step indicator ──────────────────────────────────────────────────────
function StepIndicator({
  steps,
  current,
}: {
  steps: readonly { title: string; emoji: string }[]
  current: number
}) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, i) => (
        <div key={step.title} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                i === current
                  ? 'bg-gray-900 text-white scale-110 shadow-md'
                  : i < current
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-400'
              )}
            >
              {i < current ? '✓' : step.emoji}
            </div>
            <span
              className={cn(
                'text-[10px] font-medium transition-colors duration-200',
                i === current
                  ? 'text-gray-900'
                  : i < current
                    ? 'text-emerald-600'
                    : 'text-gray-400'
              )}
            >
              {step.title}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'w-10 h-0.5 mx-1.5 mt-[-1.25rem] rounded-full transition-colors duration-300',
                i < current ? 'bg-emerald-200' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────
export function DebtForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: accounts = [] } = useAccounts()
  const createDebt = useCreateDebt()

  const [currentStep, setCurrentStep] = useState(0)

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
      date:         getLocalDateString(),
    },
  })

  const type      = useWatch({ control: form.control, name: 'type' })
  const accountId = useWatch({ control: form.control, name: 'account_id' })
  const amount    = useWatch({ control: form.control, name: 'amount' }) ?? 0

  const handleNext = async () => {
    const fields = STEP_FIELDS[currentStep]
    const valid = await form.trigger(fields)
    if (valid) setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }

  const onSubmit = async (data: CreateDebtInput) => {
    await createDebt.mutateAsync(data, {
      onSuccess: () => {
        form.reset()
        onSuccess()
      },
    })
  }

  const isLastStep = currentStep === STEPS.length - 1

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <StepIndicator steps={STEPS} current={currentStep} />

        {/* ── Step 1: Tipo ── */}
        {currentStep === 0 && (
          <div className="space-y-5 pt-2">
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
          </div>
        )}

        {/* ── Step 2: Monto ── */}
        {currentStep === 1 && (
          <div className="space-y-5 pt-2">
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

            <FormField<CreateDebtInput>
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
                      value={(field.value as string) ?? ''}
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
          </div>
        )}

        {/* ── Step 3: Cuenta ── */}
        {currentStep === 2 && (
          <div className="space-y-5 pt-2">
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
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between pt-2">
          {currentStep > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              className="gap-1.5 text-gray-500 hover:text-gray-700 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </Button>
          ) : (
            <div />
          )}

          {isLastStep ? (
            <SubmitButton isPending={createDebt.isPending}>
              Registrar deuda
            </SubmitButton>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              className="gap-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
