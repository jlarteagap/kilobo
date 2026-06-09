// features/dashboard/components/DashboardBudgets.tsx
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { BUDGET_TYPES, BUDGET_STATUS_CONFIG } from "@/types/budget"
import type { BudgetProgress } from "@/types/budget"
import { ProgressBar } from "@/components/ui/progress-bar"
import type { ProgressVariant } from "@/components/ui/progress-bar"

interface DashboardBudgetsProps {
  topBudgets: BudgetProgress[]
}

const statusToVariant: Record<BudgetProgress['status'], ProgressVariant> = {
  COMPLETED: 'success',
  OVERDUE:   'danger',
  AT_RISK:   'warning',
  ON_TRACK:  'default',
}

export function DashboardBudgets({ topBudgets }: DashboardBudgetsProps) {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col gap-4 shadow-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Presupuestos</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Este mes</p>
        </div>
        <Link
          href="/budgets"
          className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          Ver todos
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Lista */}
      {topBudgets.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-2xl mb-1">📋</p>
          <p className="text-[12px] text-gray-400">Sin presupuestos activos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topBudgets.map((p) => {
            const typeConfig   = BUDGET_TYPES.find((t) => t.value === p.budget.type)!
            const statusConfig = BUDGET_STATUS_CONFIG[p.status]

            return (
              <div key={p.budget.id} className="space-y-2">
                {/* Nombre + status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{typeConfig.emoji}</span>
                    <p className="text-[13px] font-medium text-gray-700 truncate">
                      {p.budget.name}
                    </p>
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2',
                    statusConfig.color,
                    statusConfig.bg,
                  )}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Barra */}
                <ProgressBar
                  value={p.current_amount}
                  max={p.target_amount}
                  variant={statusToVariant[p.status]}
                />

                {/* Montos */}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">
                    {formatCurrency(p.current_amount, p.budget.currency)}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {p.percent.toFixed(0)}% de {formatCurrency(p.target_amount, p.budget.currency)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
