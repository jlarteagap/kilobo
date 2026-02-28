// features/budgets/components/BudgetSummary.tsx
"use client"

import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { useBudgetSummary, useBudgetProgress } from "../hooks/useBudgets"

export function BudgetSummary() {
  const summary  = useBudgetSummary()
  const progress = useBudgetProgress()

  // Meta prioritaria — primer FIXED_EXPENSE activo con due_day
  const priorityBudget = progress.find(
    (p) => p.budget.type === 'FIXED_EXPENSE' && p.budget.due_day && p.budget.is_active
  )

  return (
    <div className="space-y-4">

      {/* ── Meta prioritaria ── */}
      {priorityBudget && (
        <div
          className="bg-white rounded-2xl p-5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">🎯</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">Meta prioritaria</p>
              <p className="text-[11px] text-gray-400">{priorityBudget.budget.name}</p>
            </div>
            {priorityBudget.days_until_due !== null && (
              <span className={cn(
                'ml-auto text-[11px] font-medium px-2.5 py-1 rounded-full',
                priorityBudget.days_until_due <= 0
                  ? 'bg-rose-50 text-rose-500'
                  : priorityBudget.days_until_due <= 3
                    ? 'bg-orange-50 text-orange-500'
                    : 'bg-gray-100 text-gray-400'
              )}>
                {priorityBudget.days_until_due <= 0
                  ? 'Vencido'
                  : priorityBudget.days_until_due === 0
                    ? 'Vence hoy'
                    : `${priorityBudget.days_until_due}d restantes`
                }
              </span>
            )}
          </div>

          {/* Barra grande */}
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  priorityBudget.status === 'COMPLETED' ? 'bg-emerald-400' :
                  priorityBudget.status === 'OVERDUE'   ? 'bg-rose-400'    :
                  priorityBudget.status === 'AT_RISK'   ? 'bg-orange-400'  :
                  'bg-gray-900'
                )}
                style={{ width: `${Math.min(priorityBudget.percent, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-gray-500">
                {formatCurrency(priorityBudget.current_amount, priorityBudget.budget.currency)}
                {' '}acumulado
              </span>
              <span className="text-[12px] font-semibold text-gray-700">
                {formatCurrency(priorityBudget.target_amount, priorityBudget.budget.currency)}
              </span>
            </div>
          </div>

          {/* Faltante */}
          {priorityBudget.status !== 'COMPLETED' && (
            <p className={cn(
              'text-[12px] mt-2 font-medium',
              priorityBudget.status === 'OVERDUE' ? 'text-rose-500' : 'text-gray-400'
            )}>
              {priorityBudget.status === 'OVERDUE'
                ? `⚠️ Faltan ${formatCurrency(priorityBudget.remaining, priorityBudget.budget.currency)} — vencido`
                : `Faltan ${formatCurrency(priorityBudget.remaining, priorityBudget.budget.currency)} para completar`
              }
            </p>
          )}
        </div>
      )}

      {/* ── Resumen global ── */}
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Resumen del mes</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {new Date().toLocaleString('es-BO', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="divide-y divide-gray-50">
          {/* Ingresos */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">
                💰
              </div>
              <span className="text-[13px] text-gray-600">Total ingresos</span>
            </div>
            <span className="text-[13px] font-semibold text-emerald-600">
              {formatCurrency(summary.totalIncome, 'BOB')}
            </span>
          </div>

          {/* Gastos fijos */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-sm">
                📌
              </div>
              <span className="text-[13px] text-gray-600">Gastos fijos</span>
            </div>
            <span className="text-[13px] font-semibold text-rose-500">
              -{formatCurrency(summary.totalFixedExpense, 'BOB')}
            </span>
          </div>

          {/* Metas de ahorro */}
          {summary.totalSavingsGoal > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-sm">
                  🎯
                </div>
                <span className="text-[13px] text-gray-600">Metas de ahorro</span>
              </div>
              <span className="text-[13px] font-semibold text-blue-500">
                -{formatCurrency(summary.totalSavingsGoal, 'BOB')}
              </span>
            </div>
          )}

          {/* Disponible */}
          <div className={cn(
            'flex items-center justify-between px-5 py-4',
            summary.isDeficit ? 'bg-rose-50/60' : 'bg-emerald-50/40'
          )}>
            <div className="flex items-center gap-2.5">
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center text-sm',
                summary.isDeficit ? 'bg-rose-100' : 'bg-emerald-100'
              )}>
                {summary.isDeficit ? '⚠️' : '✅'}
              </div>
              <span className="text-[13px] font-semibold text-gray-700">
                Disponible
              </span>
            </div>
            <span className={cn(
              'text-sm font-bold',
              summary.isDeficit ? 'text-rose-500' : 'text-emerald-600'
            )}>
              {summary.isDeficit ? '-' : ''}
              {formatCurrency(Math.abs(summary.available), 'BOB')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}