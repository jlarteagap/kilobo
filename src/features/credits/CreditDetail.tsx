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
    { label: 'Original',  value: formatCurrency(credit.original_amount, credit.currency), color: 'text-gray-900' },
    { label: 'Saldo',     value: formatCurrency(credit.current_balance, credit.currency), color: 'text-emerald-600' },
    { label: 'Tasa',      value: `${credit.annual_interest_rate}% anual`, color: 'text-gray-600' },
    { label: 'Plazo',     value: `${credit.total_installments} meses`, color: 'text-gray-600' },
  ]

  if (payMode) {
    const firstPending = [...installments]
      .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <span className="text-xl">{typeConfig.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{credit.institution}</p>
            <p className="text-[11px] text-gray-400">{typeConfig.label}</p>
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
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg flex-shrink-0">
          {typeConfig.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900">{credit.institution}</p>
          <p className="text-[12px] text-gray-400">{typeConfig.label}</p>
        </div>
        <span className={cn(
          'text-[12px] font-semibold px-3 py-1 rounded-full flex-shrink-0',
          credit.status === 'ACTIVE' ? 'text-emerald-600 bg-emerald-50' :
          credit.status === 'PAID' ? 'text-gray-500 bg-gray-100' :
          'text-rose-600 bg-rose-50'
        )}>
          {credit.status === 'ACTIVE' ? 'Activo' : credit.status === 'PAID' ? 'Pagado' : 'Cancelado'}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
            <p className={cn('text-sm font-semibold', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Notes */}
      {credit.notes && (
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-[11px] text-gray-400 mb-1">Notas</p>
          <p className="text-[13px] text-gray-600">{credit.notes}</p>
        </div>
      )}

      {/* Installments section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Cuotas ({credit.paid_installments}/{credit.total_installments} pagadas)
          </h4>
          {!isPaidAll && (
            <button
              type="button"
              onClick={() => setShowPayForm(!showPayForm)}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
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
              <p className="text-[13px] text-gray-400 text-center py-4">
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
