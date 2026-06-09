"use client"

import { Banknote, Pencil, Trash2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProgressBar } from "@/components/ui/progress-bar"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { CREDIT_TYPES, CREDIT_STATUS_CONFIG, INSTALLMENT_STATUS_CONFIG } from "@/types/credit"
import type { Credit, Installment } from "@/types/credit"

interface CreditCardProps {
  credit: Credit
  nextInstallment?: Installment | null
  onDetail:   (credit: Credit) => void
  onPay:      (credit: Credit) => void
  onCancel?:  (credit: Credit) => void
  onDelete?:  (credit: Credit) => void
}

export function CreditCard({
  credit,
  nextInstallment,
  onDetail,
  onPay,
  onCancel,
  onDelete,
}: CreditCardProps) {
  const typeConfig   = CREDIT_TYPES.find((t) => t.value === credit.type)!
  const statusConfig = CREDIT_STATUS_CONFIG[credit.status]
  const isActive     = credit.status === 'ACTIVE'
  const isPaid       = credit.status === 'PAID'
  const progress     = credit.total_installments > 0
    ? (credit.paid_installments / credit.total_installments) * 100
    : 0

  const isOverdue = nextInstallment?.status === 'OVERDUE'

  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 group shadow-card-hover',
        'hover:shadow-md',
        isPaid && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onDetail(credit)}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
        >
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0',
            isActive ? 'bg-emerald-50' : 'bg-gray-50'
          )}>
            {typeConfig.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {credit.institution}
            </p>
            <p className="text-[11px] text-gray-400">
              {typeConfig.label}
            </p>
          </div>
        </button>

        <span className={cn(
          'text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0',
          statusConfig.color,
          statusConfig.bg
        )}>
          {statusConfig.label}
        </span>
      </div>

      {/* Amount */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] text-gray-400 mb-0.5">
            {isActive ? 'Saldo actual' : 'Monto original'}
          </p>
          <p className="text-xl font-semibold tracking-tight text-gray-900">
            {formatCurrency(
              isActive ? credit.current_balance : credit.original_amount,
              credit.currency
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400 mb-0.5">
            {credit.paid_installments}/{credit.total_installments}
          </p>
          <p className="text-sm font-medium text-gray-500">cuotas</p>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar
        value={credit.paid_installments}
        max={credit.total_installments}
        variant={isPaid ? 'success' : 'default'}
        showLabel
      />

      {/* Next installment */}
      {nextInstallment && isActive && (
        <div className={cn(
          'flex items-center justify-between px-3 py-2 rounded-xl text-[12px]',
          isOverdue ? 'bg-rose-50' : 'bg-gray-50'
        )}>
          <div className="flex items-center gap-1.5">
            <span className={isOverdue ? 'text-rose-500' : 'text-gray-400'}>
              {isOverdue ? '🔴' : '📅'}
            </span>
            <span className={cn(
              'font-medium',
              isOverdue ? 'text-rose-600' : 'text-gray-600'
            )}>
              {isOverdue ? 'Vencida' : 'Próxima'}:
            </span>
            <span className="text-gray-500">
              {new Date(nextInstallment.due_date).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'short'
              })}
            </span>
          </div>
          <span className="font-semibold text-gray-900">
            {formatCurrency(nextInstallment.total_amount, credit.currency)}
          </span>
        </div>
      )}

      {!isActive && (
        <div className="text-center py-1">
          <span className="text-[12px] text-gray-400">
            {isPaid
              ? `Pagado el ${new Date(credit.updated_at).toLocaleDateString('es-ES')}`
              : 'Crédito cancelado'
            }
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
        {isActive && (
          <button
            type="button"
            onClick={() => onPay(credit)}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
              isOverdue
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-gray-900 hover:bg-gray-800 text-white'
            )}
          >
            {isOverdue ? 'Pagar vencida' : 'Pagar cuota'}
          </button>
        )}

        {isActive && onCancel && (
          <button
            type="button"
            onClick={() => onCancel(credit)}
            title="Cancelar crédito"
            className="p-2 rounded-xl text-gray-300 hover:text-orange-500 hover:bg-orange-50 transition-all duration-150"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(credit)}
            title="Eliminar"
            className="p-2 rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all duration-150"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
