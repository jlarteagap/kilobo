'use client'

import { useSavingsGoals } from '@/features/savings-goals/hooks/useSavingsGoals'
import { ProgressBar } from '@/components/ui/progress-bar'
import { formatCurrency } from '@/features/accounts/utils/account-display.utils'
import Link from 'next/link'

export function DashboardSavingsGoals() {
  const { data: goals = [], isLoading } = useSavingsGoals()

  const activeGoals = goals
    .filter(g => g.is_active)
    .sort((a, b) => {
      const aPct = a.target_amount > 0 ? a.current_amount / a.target_amount : 0
      const bPct = b.target_amount > 0 ? b.current_amount / b.target_amount : 0
      return aPct - bPct
    })
    .slice(0, 3)

  if (isLoading) return null
  if (activeGoals.length === 0) return null

  return (
    <div className="bg-card rounded-3xl p-6 border border-border/40"
      style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.02)' }}>
      <Link href="/ahorros" className="flex items-center justify-between mb-5 group">
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">Metas de Ahorro</h3>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Seguimiento de tus alcancías</p>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
          Ver todas →
        </span>
      </Link>

      <div className="space-y-5">
        {activeGoals.map(goal => {
          const percent = goal.target_amount > 0
            ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
            : 0
          const isCompleted = goal.current_amount >= goal.target_amount

          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{goal.icon}</span>
                  <span className="text-[13px] font-medium text-foreground truncate">{goal.name}</span>
                </div>
                <span className="text-[12px] font-semibold text-foreground tabular-nums shrink-0 ml-2">
                  {formatCurrency(goal.current_amount, goal.currency)}
                </span>
              </div>
              <ProgressBar
                value={goal.current_amount}
                max={goal.target_amount}
                variant={isCompleted ? 'success' : 'default'}
                size="sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/60">
                  {percent.toFixed(0)}% · Meta: {formatCurrency(goal.target_amount, goal.currency)}
                </span>
                {goal.auto_save_percentage > 0 && (
                  <span className="text-[10px] text-muted-foreground/40">
                    Auto {goal.auto_save_percentage}%
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
