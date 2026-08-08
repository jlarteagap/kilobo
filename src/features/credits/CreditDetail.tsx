"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { CREDIT_TYPES } from "@/types/credit"
import type { Credit, Installment } from "@/types/credit"
import { InstallmentsTable } from "./components/InstallmentsTable"
import { AmortizationChart } from "./components/AmortizationChart"
import { PayInstallmentsForm } from "./components/PayInstallmentsForm"

interface CreditDetailProps {
  credit: Credit
  installments: Installment[]
  onClose: () => void
  payMode?: boolean
}

export function CreditDetail({
  credit,
  installments,
  onClose,
  payMode = false,
}: CreditDetailProps) {
  const typeConfig = CREDIT_TYPES.find((t) => t.value === credit.type)!
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showPayForm, setShowPayForm] = useState(false)
  const activeInsts = installments.filter((i) => i.status !== 'PAID')
  const isPaidAll   = activeInsts.length === 0

  const summaryCards = [
    { label: 'Original',  value: formatCurrency(credit.original_amount, credit.currency), color: 'text-foreground' },
    { label: 'Saldo',     value: formatCurrency(credit.current_balance, credit.currency), color: 'text-[#4F6A35]' },
    { label: 'Tasa',      value: `${credit.annual_interest_rate}% anual`, color: 'text-foreground' },
    { label: 'Plazo',     value: `${credit.total_installments} meses`, color: 'text-foreground' },
  ]

  if (payMode) {
    const firstPending = [...installments]
      .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[rgba(0,0,0,0.06)]">
          <span className="text-xl">{typeConfig.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{credit.institution}</p>
            <p className="text-[11px] text-[#6E6E73]">{typeConfig.label}</p>
          </div>
        </div>

        {firstPending && (
          <PayInstallmentsForm
            credit={credit}
            installment={firstPending}
            onSuccess={onClose}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[rgba(0,0,0,0.06)]">
        <div className="w-10 h-10 rounded-xl bg-[#F2F9E3] flex items-center justify-center text-lg flex-shrink-0">
          {typeConfig.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground">{credit.institution}</p>
          <p className="text-[12px] text-[#6E6E73]">{typeConfig.label}</p>
        </div>
        <span className={cn(
          'text-[12px] font-semibold px-3 py-1 rounded-full flex-shrink-0',
          credit.status === 'ACTIVE' ? 'text-[#4F6A35] bg-[#F2F9E3]' :
          credit.status === 'PAID' ? 'text-[#6E6E73] bg-[rgba(0,0,0,0.06)]' :
          'text-[#B5543D] bg-[#FAEDE9]'
        )}>
          {credit.status === 'ACTIVE' ? 'Activo' : credit.status === 'PAID' ? 'Pagado' : 'Cancelado'}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value, color }) => (
          <div key={label} className="bg-[#F2F9E3]/40 rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-[#6E6E73] mb-0.5">{label}</p>
            <p className={cn('text-sm font-semibold', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Notes */}
      {credit.notes && (
        <div className="bg-[#F2F9E3]/40 rounded-xl px-4 py-3">
          <p className="text-[11px] text-[#6E6E73] mb-1">Notas</p>
          <p className="text-[13px] text-foreground">{credit.notes}</p>
        </div>
      )}

      {/* Installments section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-foreground tracking-[-0.01em]">
            Cuotas ({credit.paid_installments}/{credit.total_installments} pagadas)
          </h4>
          {!isPaidAll && (
            <button
              type="button"
              onClick={() => setShowPayForm(!showPayForm)}
              className="text-xs font-semibold text-[#4F6A35] hover:text-[#4F6A35]/80 transition-colors"
            >
              {showPayForm ? 'Ver tabla' : 'Pagar cuotas'}
            </button>
          )}
        </div>

        {showPayForm ? (
          (() => {
            const firstPending = [...installments]
              .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
              .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
            return firstPending ? (
              <PayInstallmentsForm
                credit={credit}
                installment={firstPending}
                onSuccess={onClose}
              />
            ) : (
              <p className="text-[13px] text-[#6E6E73] text-center py-4">
                No hay cuotas pendientes
              </p>
            )
          })()
        ) : (
          <InstallmentsTable
            installments={installments}
            currency={credit.currency}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        )}
      </div>

      {/* Amortization chart */}
      {installments.length > 1 && !showPayForm && (
        <AmortizationChart
          installments={installments}
          currency={credit.currency}
        />
      )}
    </div>
  )
}
