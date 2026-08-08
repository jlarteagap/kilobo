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

export function AccountForm({ initialData, onSubmit, onCancel, isPending }: AccountFormProps) {
  const isEdit = !!initialData

  const form = useForm<CreateAccountInput>({
    resolver: createZodResolver(createAccountSchema),
    defaultValues: {
      name:     initialData?.name     ?? '',
      type:     initialData?.type     ?? 'BANK',
      balance:  initialData?.balance  ?? 0,
      currency: initialData?.currency ?? 'BOB',
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
              <FormLabel className="text-[13px] font-medium text-foreground">
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
                            ? 'border-[#4F6A35] bg-[#4F6A35] text-white'
                            : 'border-[rgba(0,0,0,0.06)] bg-[#F2F9E3]/40 text-[#6E6E73] hover:border-[rgba(0,0,0,0.12)] hover:bg-[#F2F9E3]'
                        )}
                      >
                        <Icon className={cn('w-4 h-4', isSelected ? 'text-white' : color)} />
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
              <FormLabel className="text-[13px] font-medium text-foreground">
                Nombre
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Banco Nacional, Efectivo…"
                  {...field}
                  className="rounded-xl border-0 bg-[#F2F9E3]/40 focus-visible:ring-[#5F7D42]/30"
                />
              </FormControl>
              <FormMessage className="text-[12px]" />
            </FormItem>
          )}
        />

        {/* ── Saldo + Moneda ── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField<CreateAccountInput>
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-foreground">
                  Saldo inicial
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

          <FormField<CreateAccountInput>
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

        {/* ── Acciones ── */}
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
            {isEdit ? 'Guardar cambios' : 'Crear cuenta'}
          </SubmitButton>
        </div>
      </form>
    </Form>
  )
}