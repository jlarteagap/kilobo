"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { createZodResolver } from "@/lib/validations/rhf-resolver"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/ui/submit-button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createCreditSchema, type CreateCreditInput } from "@/lib/validations/credit.schema"
import { CREDIT_TYPES } from "@/types/credit"
import { CURRENCY_TYPES } from "@/types/account"
import { useCreateCredit } from "@/features/credits/hooks/useCredits"

function getLocalDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Step config ─────────────────────────────────────────────────────────
const STEPS = [
  { title: 'Tipo',  emoji: '🏦' },
  { title: 'Monto', emoji: '💰' },
  { title: 'Plan',  emoji: '📅' },
] as const

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

interface CreditFormProps {
  onSuccess: () => void
}

// ─── Componente principal ────────────────────────────────────────────────
export function CreditForm({ onSuccess }: CreditFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [hasHistory, setHasHistory] = useState(false)

  const { mutateAsync: createCredit, isPending } = useCreateCredit()

  const form = useForm<CreateCreditInput>({
    resolver: createZodResolver(createCreditSchema),
    defaultValues: {
      type: 'BANK',
      institution: '',
      original_amount: 0,
      currency: 'BOB',
      annual_interest_rate: 0,
      total_installments: 0,
      paid_installments: 0,
      start_date: getLocalDateString(),
      first_payment_date: getLocalDateString(),
      notes: null,
      has_history: false,
    },
  })

  // ── Step fields (dynamic based on hasHistory) ──────────────────────────

  const step2Fields: (keyof CreateCreditInput)[] = hasHistory
    ? ['original_amount', 'currency', 'paid_installments', 'total_installments']
    : ['original_amount', 'currency']

  const step3Fields: (keyof CreateCreditInput)[] = hasHistory
    ? ['annual_interest_rate', 'first_payment_date']
    : ['annual_interest_rate', 'total_installments', 'start_date', 'first_payment_date']

  const handleNext = async () => {
    let fields: (keyof CreateCreditInput)[] = []
    if (currentStep === 0) fields = ['type', 'institution']
    else if (currentStep === 1) fields = step2Fields
    else if (currentStep === 2) fields = step3Fields
    const valid = await form.trigger(fields)
    if (valid) setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async (data: CreateCreditInput) => {
    await createCredit(data)
    onSuccess()
  }

  const isLastStep = currentStep === STEPS.length - 1

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <StepIndicator steps={STEPS} current={currentStep} />

        {/* ── Step 1: Tipo ── */}
        {currentStep === 0 && (
          <div className="space-y-5 pt-2">
            <FormField<CreateCreditInput>
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-gray-600">
                    Tipo de crédito
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 gap-2">
                      {CREDIT_TYPES.map(({ value, label, description, emoji }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => field.onChange(value)}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200',
                            field.value === value
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-white'
                          )}
                        >
                          <span className="text-xl flex-shrink-0">{emoji}</span>
                          <div>
                            <p className={cn(
                              'text-[13px] font-semibold',
                              field.value === value ? 'text-white' : 'text-gray-700'
                            )}>
                              {label}
                            </p>
                            <p className={cn(
                              'text-[11px] leading-tight mt-0.5',
                              field.value === value ? 'text-gray-300' : 'text-gray-400'
                            )}>
                              {description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}
            />

            <FormField<CreateCreditInput, 'institution'>
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-gray-600">
                    Institución
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Banco BCP, Banco Mercantil…"
                      name={field.name}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      value={field.value as string}
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
            {/* Has history toggle */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
              <Checkbox
                checked={hasHistory}
                onCheckedChange={(checked) => {
                  setHasHistory(!!checked)
                  form.setValue('has_history', !!checked)
                }}
                className="mt-0.5 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
              />
              <div className="space-y-0.5">
                <FormLabel className="text-[13px] font-medium text-gray-700 cursor-pointer">
                  Tiene historial previo
                </FormLabel>
                <p className="text-[12px] text-gray-400 leading-relaxed">
                  El crédito ya tiene cuotas pagadas antes de registrarlo en Kilo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField<CreateCreditInput, 'original_amount'>
                control={form.control}
                name="original_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-gray-600">
                      Monto original
                      {hasHistory && <span className="text-gray-400 font-normal ml-1">(ref.)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        name={field.name}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        value={field.value ?? ''}
                        className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                      />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />

              <FormField<CreateCreditInput>
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
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Conditional fields for history */}
            {hasHistory && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField<CreateCreditInput, 'paid_installments'>
                    control={form.control}
                    name="paid_installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-gray-600">
                          Cuotas pagadas
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            {...field}
                            value={field.value || ''}
                            className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                          />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />

                  <FormField<CreateCreditInput, 'total_installments'>
                    control={form.control}
                    name="total_installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-gray-600">
                          Cuotas restantes
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="Ej: 12"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              const val = e.target.value ? +e.target.value : 0
                              field.onChange(val)
                            }}
                            className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                          />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 3: Plan ── */}
        {currentStep === 2 && (
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField<CreateCreditInput, 'annual_interest_rate'>
                control={form.control}
                name="annual_interest_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-gray-600">
                      Tasa interés anual
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ej: 12.5"
                        {...field}
                        value={field.value || ''}
                        className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                      />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />

              {!hasHistory && (
                <FormField<CreateCreditInput, 'total_installments'>
                  control={form.control}
                  name="total_installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium text-gray-600">
                        Plazo total (meses)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Ej: 60"
                          {...field}
                          value={field.value || ''}
                          className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                        />
                      </FormControl>
                      <FormMessage className="text-[12px]" />
                    </FormItem>
                  )}
                />
              )}

              <FormField<CreateCreditInput, 'monthly_payment'>
                control={form.control}
                name="monthly_payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-gray-600">
                      Pago mensual
                      <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ej: 1500.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? +e.target.value : undefined)}
                        className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                      />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!hasHistory && (
                <FormField<CreateCreditInput, 'start_date'>
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium text-gray-600">
                        Fecha de inicio
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value as string}
                          className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                        />
                      </FormControl>
                      <FormMessage className="text-[12px]" />
                    </FormItem>
                  )}
                />
              )}

              <FormField<CreateCreditInput, 'first_payment_date'>
                control={form.control}
                name="first_payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-gray-600">
                      {hasHistory ? 'Próxima cuota' : 'Fecha 1er pago'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value as string}
                        className="rounded-xl border-0 bg-gray-50 focus-visible:ring-gray-900/10"
                      />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField<CreateCreditInput, 'notes'>
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
                      placeholder="Ej: Crédito para renovación de vehículo…"
                      {...field}
                      value={field.value ?? ''}
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
            <SubmitButton isPending={isPending}>
              Guardar crédito
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
