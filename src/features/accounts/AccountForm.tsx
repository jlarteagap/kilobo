// features/accounts/AccountForm.tsx
"use client"

import { useForm } from "react-hook-form"
import { createZodResolver } from "@/lib/validations/rhf-resolver"
import { cn } from "@/lib/utils"
import { SubmitButton } from "@/components/ui/submit-button"

import { Account, ACCOUNT_TYPES, CURRENCY_TYPES } from "@/types/account"
import { createAccountSchema, CreateAccountInput } from "@/lib/validations/account.schema"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAccountTypeDetails } from "./utils/account-display.utils"

interface AccountFormProps {
  initialData?: Account
  onSubmit:     (data: CreateAccountInput) => void
  onCancel:     () => void
  isPending:    boolean
}

const fieldClass = "rounded-xl bg-white border-zinc-200 focus-visible:ring-zinc-400/30"

export function AccountForm({ initialData, onSubmit, onCancel, isPending }: AccountFormProps) {
  const isEdit = !!initialData

  const form = useForm<CreateAccountInput>({
    resolver: createZodResolver(createAccountSchema),
    defaultValues: {
      name:     initialData?.name     ?? '',
      type:     initialData?.type     ?? 'BANK',
      balance:  initialData?.balance  ?? 0,
      currency: initialData?.currency ?? 'BOB',
      institution: initialData?.institution ?? '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Tipo de cuenta — segmented visual ── */}
        <FormField<CreateAccountInput>
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-zinc-900">
                Tipo de cuenta
              </FormLabel>
              <FormControl>
                <div className="grid grid-cols-3 gap-2">
                  {ACCOUNT_TYPES.map(({ value, label }) => {
                    const { icon: Icon, color } = getAccountTypeDetails(value)
                    const isSelected = field.value === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[11px] font-medium',
                          'border transition-all duration-200',
                          isSelected
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100'
                        )}
                      >
                        <Icon
                          className={cn('w-4 h-4', isSelected && 'text-white')}
                          style={isSelected ? undefined : { color }}
                        />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Nombre ── */}
        <FormField<CreateAccountInput>
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium text-zinc-900">
                Nombre
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Banco Nacional, Efectivo…"
                  {...field}
                  className={fieldClass}
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Institución — solo para cuentas bancarias ── */}
        {form.watch('type') === 'BANK' && (
          <FormField<CreateAccountInput>
            control={form.control}
            name="institution"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-zinc-900">
                  Institución / Banco
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Banco Mercantil, Banco Unión…"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    className={fieldClass}
                  />
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />
        )}

        {/* ── Saldo + Moneda ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField<CreateAccountInput>
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-zinc-900">
                  Saldo inicial
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(+e.target.value)}
                    className={fieldClass}
                  />
                </FormControl>
                <FormMessage className="text-[12px]" />
              </FormItem>
            )}
          />

          <FormField<CreateAccountInput>
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-zinc-900">
                  Moneda
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value as string}>
                  <FormControl>
                    <SelectTrigger className={fieldClass}>
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

        {/* ── Acciones ── */}
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
          <SubmitButton isPending={isPending} className="flex-1 rounded-xl bg-zinc-900 hover:bg-zinc-800">
            {isEdit ? 'Guardar cambios' : 'Crear cuenta'}
          </SubmitButton>
        </div>
      </form>
    </Form>
  )
}