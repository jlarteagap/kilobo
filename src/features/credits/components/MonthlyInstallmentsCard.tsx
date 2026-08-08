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
      <div className="bg-white rounded-[22px] p-5 opacity-60" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#F2F9E3] flex items-center justify-center text-base flex-shrink-0">
            {typeConfig.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {credit.institution}
            </p>
            <p className="text-[11px] text-[#6E6E73]">{typeConfig.label}</p>
          </div>
          <span className="text-[11px] font-medium text-[#4F6A35] bg-[#F2F9E3] px-2.5 py-1 rounded-full">
            ✓ Pagado
          </span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#6E6E73]">Cuota{pendingThisMonth.length > 1 ? 's' : ''} del mes</span>
          <span className="font-semibold text-[#6E6E73]">
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
    <div className="bg-white rounded-[22px] p-5 flex flex-col gap-3 transition-all duration-200" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#F2F9E3]/40 flex items-center justify-center text-base flex-shrink-0">
          {typeConfig.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {credit.institution}
          </p>
          <p className="text-[11px] text-[#6E6E73]">{typeConfig.label}</p>
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
                isOverdue ? 'bg-[#FAEDE9]' : 'bg-[#F2F9E3]/40'
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'text-[13px] font-medium',
                    isOverdue ? 'text-[#B5543D]' : 'text-foreground'
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
                <p className="text-[11px] text-[#6E6E73] mt-0.5">
                  Vence {new Date(inst.due_date).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-sm font-semibold',
                  isOverdue ? 'text-[#B5543D]' : 'text-foreground'
                )}>
                  {formatCurrency(inst.total_amount, credit.currency)}
                </p>
                <button
                  type="button"
                  onClick={() => onPay(credit, inst)}
                  className={cn(
                    'w-full py-2 rounded-xl text-xs font-semibold transition-colors mt-1.5',
                    isOverdue
                      ? 'bg-[#FAEDE9] text-[#B5543D] hover:bg-[#FAEDE9]'
                      : 'bg-[#4F6A35] text-white hover:bg-[#3C5230]'
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
