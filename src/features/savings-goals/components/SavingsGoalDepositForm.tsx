'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createZodResolver } from '@/lib/validations/rhf-resolver'
import { depositSavingsGoalSchema, type DepositSavingsGoalInput } from '@/lib/validations/savings-goal.schema'
import type { SavingsGoal } from '@/types/savings-goal'
import type { Account } from '@/types/account'
import { formatCurrency } from '@/features/accounts/utils/account-display.utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCcw } from 'lucide-react'

interface SavingsGoalDepositFormProps {
  goal: SavingsGoal
  accounts: Account[]
  onSubmit: (data: DepositSavingsGoalInput) => void
  isPending: boolean
}

export function SavingsGoalDepositForm({ goal, accounts, onSubmit, isPending }: SavingsGoalDepositFormProps) {
  const [accountId, setAccountId] = useState(goal.account_id)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepositSavingsGoalInput>({
    resolver: createZodResolver<DepositSavingsGoalInput>(depositSavingsGoalSchema),
    defaultValues: {
      amount: undefined,
      account_id: goal.account_id,
    },
  })

  const remaining = Math.max(goal.target_amount - goal.current_amount, 0)

  return (
    <form onSubmit={handleSubmit((data) => onSubmit({ ...data, account_id: accountId }))} className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
        <span className="text-[11px] font-medium text-muted-foreground">
          {goal.icon} {goal.name}
        </span>
        <span className="text-[11px] font-semibold text-foreground">
          Faltan {formatCurrency(remaining, goal.currency)}
        </span>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          Monto a depositar
        </Label>
        <Input
          type="number"
          step="0.01"
          min="1"
          max={remaining}
          {...register('amount')}
          placeholder="0.00"
          disabled={isPending}
          className="h-12 bg-transparent border-t-0 border-x-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-zinc-900 transition-colors shadow-none text-xl font-light tabular-nums"
        />
        {errors.amount && <p className="text-xs text-[#B5543D]">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          Cuenta de origen
        </Label>
        <Select defaultValue={goal.account_id} onValueChange={setAccountId} disabled={isPending}>
          <SelectTrigger className="h-12 bg-transparent border-t-0 border-x-0 border-b border-border rounded-none px-0 focus:ring-0 focus:border-zinc-900 transition-colors shadow-none">
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
        {errors.account_id && <p className="text-xs text-[#B5543D]">{errors.account_id.message}</p>}
      </div>

      <p className="text-[10px] text-muted-foreground italic leading-relaxed">
        El monto se registrará como un gasto real en la cuenta seleccionada y se sumará a la meta.
      </p>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all font-medium text-base shadow-lg active:scale-[0.98]"
      >
        {isPending ? <RefreshCcw className="size-5 animate-spin" /> : 'Depositar'}
      </Button>
    </form>
  )
}