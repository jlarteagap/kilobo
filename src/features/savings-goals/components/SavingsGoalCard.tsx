'use client'

import { Pencil, Archive, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/progress-bar'
import type { SavingsGoal } from '@/types/savings-goal'
import { formatCurrency } from '@/features/accounts/utils/account-display.utils'
import { differenceInDays, parseISO } from 'date-fns'

interface SavingsGoalCardProps {
  goal: SavingsGoal
  onEdit: (goal: SavingsGoal) => void
  onArchive: (goal: SavingsGoal) => void
  onDelete: (goal: SavingsGoal) => void
}

export function SavingsGoalCard({ goal, onEdit, onArchive, onDelete }: SavingsGoalCardProps) {
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0)
  const isCompleted = goal.current_amount >= goal.target_amount
  const isActive = goal.is_active

  let daysRemaining: number | null = null
  let isExpired = false
  if (goal.deadline) {
    daysRemaining = differenceInDays(parseISO(goal.deadline), new Date())
    isExpired = daysRemaining < 0
  }

  return (
    <div
      className={cn(
        'bg-card rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 group border border-border/40 shadow-sm',
        isActive && !isCompleted ? 'hover:shadow-md' : 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ backgroundColor: `${goal.color}20` }}
          >
            {goal.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{goal.name}</p>
            {goal.deadline && (
              <p className={cn(
                'text-[11px]',
                isExpired ? 'text-rose-500' : 'text-muted-foreground'
              )}>
                {isExpired ? `${Math.abs(daysRemaining!)}d vencido` : `${daysRemaining}d restantes`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
          {isActive && !isCompleted && (
            <>
              <button
                onClick={() => onEdit(goal)}
                title="Editar"
                className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-150"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onArchive(goal)}
                title="Archivar"
                className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-150"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {(!isActive || isCompleted) && (
            <button
              onClick={() => onDelete(goal)}
              title="Eliminar"
              className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-150"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] text-muted-foreground mb-0.5">Acumulado</p>
          <p className="text-xl font-semibold tracking-tight text-foreground">
            {formatCurrency(goal.current_amount, goal.currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground mb-0.5">Meta</p>
          <p className="text-sm font-medium text-muted-foreground">
            {formatCurrency(goal.target_amount, goal.currency)}
          </p>
        </div>
      </div>

      <ProgressBar
        value={goal.current_amount}
        max={goal.target_amount}
        variant={isCompleted ? 'success' : 'default'}
        showLabel
        showExtra
      />

      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        {isCompleted ? (
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full">
            🎉 Completada
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            Faltan {formatCurrency(remaining, goal.currency)}
          </span>
        )}

        {goal.auto_save_percentage > 0 && (
          <span className="text-[10px] text-muted-foreground/60 font-medium">
            Auto {goal.auto_save_percentage}%
          </span>
        )}
      </div>
    </div>
  )
}
