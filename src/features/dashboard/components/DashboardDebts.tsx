// features/dashboard/components/DashboardDebts.tsx
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import type { Debt } from "@/types/debt"

interface DashboardDebtsProps {
  activeDebts:      Debt[]
  pendingGiven:     number
  pendingReceived:  number
}

export function DashboardDebts({
  activeDebts,
  pendingGiven,
  pendingReceived,
}: DashboardDebtsProps) {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col gap-4"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Deudas activas</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {activeDebts.length} pendiente{activeDebts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/debts"
          className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          Ver todas
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Resumen por cobrar / por pagar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 rounded-xl px-3 py-2.5">
          <p className="text-[11px] text-orange-400 mb-0.5">Por cobrar</p>
          <p className="text-sm font-semibold text-orange-600">
            {formatCurrency(pendingGiven, 'BOB')}
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl px-3 py-2.5">
          <p className="text-[11px] text-blue-400 mb-0.5">Por pagar</p>
          <p className="text-sm font-semibold text-blue-600">
            {formatCurrency(pendingReceived, 'BOB')}
          </p>
        </div>
      </div>

      {/* Lista de deudas activas */}
      {activeDebts.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-2xl mb-1">🤝</p>
          <p className="text-[12px] text-gray-400">Sin deudas activas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeDebts.slice(0, 4).map((debt) => {
            const pending  = debt.amount - debt.paid_amount
            const percent  = Math.min((debt.paid_amount / debt.amount) * 100, 100)
            const isGiven  = debt.type === 'GIVEN'

            return (
              <div key={debt.id} className="flex items-center gap-3">
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0',
                  isGiven ? 'bg-orange-50' : 'bg-blue-50'
                )}>
                  {isGiven ? '💸' : '🤝'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[12px] font-medium text-gray-700 truncate">
                      {debt.contact_name}
                    </p>
                    <p className="text-[12px] font-semibold text-gray-900 flex-shrink-0 ml-2">
                      {formatCurrency(pending, debt.currency)}
                    </p>
                  </div>
                  <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
          {activeDebts.length > 4 && (
            <p className="text-[11px] text-gray-300 text-center pt-1">
              +{activeDebts.length - 4} más
            </p>
          )}
        </div>
      )}
    </div>
  )
}