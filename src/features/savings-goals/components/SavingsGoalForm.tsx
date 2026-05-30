'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSavingsGoalSchema, type CreateSavingsGoalInput } from '@/lib/validations/savings-goal.schema'
import { SAVINGS_GOAL_ICONS, SAVINGS_GOAL_COLORS } from '@/types/savings-goal'
import type { SavingsGoal } from '@/types/savings-goal'
import type { Account } from '@/types/account'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { RefreshCcw } from 'lucide-react'

interface SavingsGoalFormProps {
  goal?: SavingsGoal | null
  accounts: Account[]
  onSubmit: (data: CreateSavingsGoalInput) => void
  isPending: boolean
}

export function SavingsGoalForm({ goal, accounts, onSubmit, isPending }: SavingsGoalFormProps) {

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSavingsGoalInput>({
    resolver: zodResolver(createSavingsGoalSchema),
    defaultValues: {
      name: goal?.name ?? '',
      target_amount: goal?.target_amount ?? undefined,
      currency: goal?.currency ?? 'BOB',
      account_id: goal?.account_id ?? '',
      deadline: goal?.deadline ?? '',
      icon: goal?.icon ?? '🎯',
      color: goal?.color ?? '#10b981',
      auto_save_percentage: goal?.auto_save_percentage ?? 0,
    },
  })

  const selectedIcon = watch('icon')
  const selectedColor = watch('color')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Nombre de la meta</Label>
        <Input
          {...register('name')}
          placeholder="Ej: Viaje a Copacabana"
          disabled={isPending}
          className="h-12 bg-transparent border-t-0 border-x-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 transition-colors shadow-none text-lg"
        />
        {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Meta (Bs)</Label>
          <Input
            type="number"
            step="0.01"
            min="1"
            {...register('target_amount')}
            placeholder="5000"
            disabled={isPending}
            className="h-12 bg-transparent border-t-0 border-x-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 transition-colors shadow-none text-xl font-light tabular-nums"
          />
          {errors.target_amount && <p className="text-xs text-rose-500">{errors.target_amount.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Cuenta vinculada</Label>
          <Select
            defaultValue={goal?.account_id ?? ''}
            onValueChange={(v) => setValue('account_id', v)}
            disabled={isPending}
          >
            <SelectTrigger className="h-12 bg-transparent border-t-0 border-x-0 border-b border-border rounded-none px-0 focus:ring-0 focus:border-emerald-500 transition-colors shadow-none">
              <SelectValue placeholder="Seleccionar cuenta" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border shadow-xl">
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id} className="py-3 cursor-pointer">
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.account_id && <p className="text-xs text-rose-500">{errors.account_id.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Fecha límite (opcional)</Label>
        <Input
          type="date"
          {...register('deadline')}
          disabled={isPending}
          className="h-12 bg-transparent border-t-0 border-x-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 transition-colors shadow-none"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Ícono</Label>
        <div className="flex flex-wrap gap-2">
          {SAVINGS_GOAL_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setValue('icon', icon)}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-150 border',
                selectedIcon === icon
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 scale-110'
                  : 'border-border hover:border-muted-foreground/30'
              )}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Color</Label>
        <div className="flex flex-wrap gap-2">
          {SAVINGS_GOAL_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={cn(
                'w-8 h-8 rounded-full transition-all duration-150 border-2',
                selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          Ahorro automático (% de cada ingreso)
        </Label>
        <Input
          type="number"
          min="0"
          max="100"
          {...register('auto_save_percentage')}
          placeholder="10"
          disabled={isPending}
          className="h-12 bg-transparent border-t-0 border-x-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 transition-colors shadow-none text-xl font-light tabular-nums"
        />
        <p className="text-[10px] text-muted-foreground italic">
          Se apartará este porcentaje automáticamente al registrar un ingreso.
        </p>
        {errors.auto_save_percentage && <p className="text-xs text-rose-500">{errors.auto_save_percentage.message}</p>}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all font-medium text-base shadow-lg active:scale-[0.98]"
      >
        {isPending ? <RefreshCcw className="size-5 animate-spin" /> : goal ? 'Guardar cambios' : 'Crear meta'}
      </Button>
    </form>
  )
}
