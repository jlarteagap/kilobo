"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Account, ACCOUNT_TYPES, CURRENCY_TYPES } from "@/types/account"
import { createAccountSchema, CreateAccountInput } from '@/lib/validations/account.schema'

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface AccountFormProps {
  initialData?: Account
  onSubmit: (data: CreateAccountInput) => void
  onCancel: () => void
  isPending: boolean
}

export function AccountForm({ initialData, onSubmit, onCancel, isPending }: AccountFormProps) {
  const form = useForm<Account>({
    resolver: zodResolver(createAccountSchema) as any,
    defaultValues: {
      name: initialData?.name ?? "",
      type: initialData?.type ?? "BANK",
      balance: initialData?.balance ?? 0,
      currency: initialData?.currency ?? "BOB", 
    },
  })

function handleSubmit(data: CreateAccountInput) {
  onSubmit(data)
}

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Cuenta</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Banco General" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cuenta</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona la moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCY_TYPES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Saldo Actual</FormLabel>
                <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      {...field}
                      onChange={event => field.onChange(+event.target.value)}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isPending}>
           {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending
              ? "Guardando..."
              : initialData ? "Guardar Cambios" : "Crear Cuenta"
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}
