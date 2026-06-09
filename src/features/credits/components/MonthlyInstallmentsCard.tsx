"use client"

import { cn } from "@/lib/utils"
import { ProgressBar } from "@/components/ui/progress-bar"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { CREDIT_TYPES, INSTALLMENT_STATUS_CONFIG } from "@/types/credit"
import type { Credit, Installment } from "@/types/credit"

interface MonthlyInstallmentsCardProps {
  credit: Credit
  installments: Installment[]
  pendingThisMonth: Installment[]
  onPay: (credit: Credit, installment: Installment) => void
}

export function MonthlyInstallmentsCard({
  credit,
  installments,
  pendingThisMonth,
  onPay,
}: MonthlyInstallmentsCardProps) {
  const typeConfig    = CREDIT_TYPES.find((t) => t.value === credit.type)!
  const progress      = credit.total_installments > 0
    ? (credit.paid_installments / credit.total_installments) * 100
    : 0

  const allPaidThisMonth = pendingThisMonth.every((i) => i.status === 'PAID')

  if (allPaidThisMonth && pendingThisMonth.length > 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-card opacity-60">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-base flex-shrink-0">
            {typeConfig.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {credit.institution}
            </p>
            <p className="text-[11px] text-gray-400">{typeConfig.label}</p>
          </div>
          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            ✓ Pagado
          </span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-gray-400">Cuota{pendingThisMonth.length > 1 ? 's' : ''} del mes</span>
          <span className="font-semibold text-gray-500">
            {formatCurrency(
              pendingThisMonth.reduce((sum, i) => sum + i.total_amount, 0),
              credit.currency
            )}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-card-hover hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-base flex-shrink-0">
          {typeConfig.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {credit.institution}
          </p>
          <p className="text-[11px] text-gray-400">{typeConfig.label}</p>
        </div>
      </div>

      {/* Pending installments this month */}
      <div className="space-y-2">
        {pendingThisMonth.map((inst) => {
          const isOverdue = inst.status === 'OVERDUE'
          return (
            <div
              key={inst.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-xl',
                isOverdue ? 'bg-rose-50' : 'bg-gray-50'
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'text-[13px] font-medium',
                    isOverdue ? 'text-rose-700' : 'text-gray-700'
                  )}>
                    Cuota #{inst.number}
                  </p>
                  <span className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                    INSTALLMENT_STATUS_CONFIG[inst.status].color,
                    INSTALLMENT_STATUS_CONFIG[inst.status].bg
                  )}>
                    {INSTALLMENT_STATUS_CONFIG[inst.status].label}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Vence {new Date(inst.due_date).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-sm font-semibold',
                  isOverdue ? 'text-rose-600' : 'text-gray-900'
                )}>
                  {formatCurrency(inst.total_amount, credit.currency)}
                </p>
                <button
                  type="button"
                  onClick={() => onPay(credit, inst)}
                  className={cn(
                    'w-full py-2 rounded-xl text-xs font-semibold transition-colors mt-1.5',
                    isOverdue
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  )}
                >
                  Registrar pago
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress */}
      <ProgressBar
        value={credit.paid_installments}
        max={credit.total_installments}
        variant="default"
        showLabel
      />
    </div>
  )
}
