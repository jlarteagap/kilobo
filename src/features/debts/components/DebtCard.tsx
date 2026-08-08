// features/debts/components/DebtCard.tsx
"use client"

import { Trash2, CreditCard, Ban } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import type { Debt } from "@/types/debt"

interface DebtCardProps {
  debt:      Debt
  onPay:     (debt: Debt) => void
  onCancel:  (debt: Debt) => void
  onDelete:  (debt: Debt) => void
}

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Activa',    color: 'bg-blue-50 text-blue-600'     },
  PAID:      { label: 'Pagada',    color: 'bg-[#F2F9E3] text-[#4F6A35]' },
  CANCELLED: { label: 'Cancelada', color: 'bg-[rgba(0,0,0,0.06)] text-[#6E6E73]'    },
}

export function DebtCard({ debt, onPay, onCancel, onDelete }: DebtCardProps) {
  const pending    = debt.amount - debt.paid_amount
  const percent    = Math.min((debt.paid_amount / debt.amount) * 100, 100)
  const isActive   = debt.status === 'ACTIVE'
  const isPaid     = debt.status === 'PAID'
  const isGiven    = debt.type   === 'GIVEN'
  const status     = STATUS_CONFIG[debt.status]

  return (
    <div
      className={cn(
        'bg-white rounded-[22px] p-5 flex flex-col gap-4 transition-all duration-200 group',
        isActive ? '' : 'opacity-70'
      )}
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Emoji tipo */}
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0',
            isGiven ? 'bg-orange-50' : 'bg-blue-50'
          )}>
            {isGiven ? '💸' : '🤝'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {debt.contact_name}
            </p>
            <p className="text-[11px] text-[#6E6E73]">
              {isGiven ? 'Te debe' : 'Le debes'}
            </p>
          </div>
        </div>

        {/* Acciones — visibles en hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {isActive ? (
            <>
              <button
                onClick={() => onCancel(debt)}
                title="Cancelar deuda"
                className="p-1.5 rounded-lg text-[#6E6E73] hover:text-orange-500 hover:bg-orange-50 transition-all duration-150"
              >
                <Ban className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(debt)}
                title="Eliminar"
                className="p-1.5 rounded-lg text-[#6E6E73] hover:text-[#B5543D] hover:bg-[#FAEDE9] transition-all duration-150"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : null}
          {!isActive ? (
            <button
              onClick={() => onDelete(debt)}
              title="Eliminar"
              className="p-1.5 rounded-lg text-[#6E6E73] hover:text-[#B5543D] hover:bg-[#FAEDE9] transition-all duration-150"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Monto + Status ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-[#6E6E73] mb-0.5">
            {isPaid ? 'Total pagado' : 'Pendiente'}
          </p>
          <p className={cn(
            'text-xl font-semibold tracking-tight',
            isPaid     ? 'text-[#4F6A35]' :
            isGiven    ? 'text-foreground'    : 'text-[#B5543D]'
          )}>
            {isPaid
              ? formatCurrency(debt.amount, debt.currency)
              : formatCurrency(pending, debt.currency)
            }
          </p>
        </div>
        <span className={cn(
          'text-[11px] font-semibold px-2.5 py-1 rounded-full',
          status.color
        )}>
          {status.label}
        </span>
      </div>

      {/* ── Barra de progreso ── */}
      {debt.paid_amount > 0 ? (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full bg-[rgba(0,0,0,0.06)] rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isPaid ? 'bg-[#4F6A35]' : 'bg-[#4F6A35]'
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[#6E6E73]">
              Pagado {formatCurrency(debt.paid_amount, debt.currency)}
            </p>
            <p className="text-[11px] text-[#6E6E73]">
              {percent.toFixed(0)}%
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Descripción ── */}
      {debt.description ? (
        <p className="text-[12px] text-[#6E6E73] leading-relaxed border-t border-[rgba(0,0,0,0.06)] pt-3">
          {debt.description}
        </p>
      ) : null}

      {/* ── Botón pagar ── */}
      {isActive ? (
        <button
          onClick={() => onPay(debt)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F2F9E3]/40 hover:bg-[#4F6A35] hover:text-white text-foreground text-[13px] font-medium transition-all duration-200 border border-[rgba(0,0,0,0.06)] hover:border-[#4F6A35]"
        >
          <CreditCard className="w-3.5 h-3.5" />
          Registrar pago
        </button>
      ) : null}
    </div>
  )
}