import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { CREDIT_TYPES } from "@/types/credit"
import type { Credit } from "@/types/credit"

interface DashboardCreditsProps {
  activeCredits: Credit[]
}

export function DashboardCredits({
  activeCredits,
}: DashboardCreditsProps) {
  const totalBalance = activeCredits.reduce((sum, c) => sum + c.current_balance, 0)
  const totalPending = activeCredits.reduce(
    (sum, c) => sum + (c.total_installments - c.paid_installments), 0
  )
  const currency     = activeCredits[0]?.currency ?? 'BOB'

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Créditos activos</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {activeCredits.length} crédito{activeCredits.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/debts"
          className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          Ver todos
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-xl px-3 py-2.5">
          <p className="text-[11px] text-emerald-400 mb-0.5">Balance total</p>
          <p className="text-sm font-semibold text-emerald-600">
            {formatCurrency(totalBalance, currency)}
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl px-3 py-2.5">
          <p className="text-[11px] text-amber-400 mb-0.5">Cuotas pend.</p>
          <p className="text-sm font-semibold text-amber-600">
            {totalPending}
          </p>
        </div>
      </div>

      {/* Lista de créditos activos */}
      {activeCredits.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-2xl mb-1">🏦</p>
          <p className="text-[12px] text-gray-400">Sin créditos activos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeCredits.slice(0, 4).map((credit) => {
            const typeConfig = CREDIT_TYPES.find((t) => t.value === credit.type)!
            const progress   = credit.total_installments > 0
              ? (credit.paid_installments / credit.total_installments) * 100
              : 0

            return (
              <div key={credit.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-sm flex-shrink-0">
                  {typeConfig.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[12px] font-medium text-gray-700 truncate">
                      {credit.institution}
                    </p>
                    <p className="text-[12px] font-semibold text-gray-900 flex-shrink-0 ml-2">
                      {formatCurrency(credit.current_balance, credit.currency)}
                    </p>
                  </div>
                  <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
          {activeCredits.length > 4 && (
            <p className="text-[11px] text-gray-300 text-center pt-1">
              +{activeCredits.length - 4} más
            </p>
          )}
        </div>
      )}
    </div>
  )
}
