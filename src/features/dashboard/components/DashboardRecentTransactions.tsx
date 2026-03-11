// features/dashboard/components/DashboardRecentTransactions.tsx
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { parseLocalDate } from "@/utils/date.utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Transaction } from "@/types/transaction"

interface DashboardRecentTransactionsProps {
  transactions: Transaction[]
}

export function DashboardRecentTransactions({
  transactions,
}: DashboardRecentTransactionsProps) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">
            Últimas transacciones
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Las 5 más recientes
          </p>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          Ver todas
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Lista */}
      {transactions.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-2">📝</p>
          <p className="text-[13px] text-gray-400">Sin transacciones recientes</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {transactions.map((tx) => {
            const isIncome   = tx.type === 'INCOME'
            const isTransfer = tx.type === 'TRANSFER'
            const date       = parseLocalDate(tx.date)

            const amountColor =
              isIncome   ? 'text-emerald-600' :
              isTransfer ? 'text-blue-500'    :
              'text-rose-500'

            const amountPrefix =
              isIncome   ? '+' :
              isTransfer ? '↔' :
              '-'

            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
              >
                {/* Icono categoría */}
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                  {tx.category?.icon ?? '💳'}
                </div>

                {/* Descripción + categoría */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 truncate">
                    {tx.description ?? tx.category?.name ?? 'Sin descripción'}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {tx.category?.name ?? tx.type} ·{' '}
                    {format(date, "d MMM", { locale: es })}
                  </p>
                </div>

                {/* Monto */}
                <p className={cn('text-[13px] font-semibold flex-shrink-0', amountColor)}>
                  {amountPrefix}{formatCurrency(tx.amount, tx.currency ?? 'BOB')}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}