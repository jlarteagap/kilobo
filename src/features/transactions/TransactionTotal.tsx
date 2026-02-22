import { Transaction } from "@/types/transaction"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { cn } from "@/lib/utils"

// Añadir este componente antes del componente principal
export function TransactionTotals({ transactions }: { transactions: Transaction[] }) {
  const totalIncome  = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0)

  const net = totalIncome - totalExpense

  return (
    <tfoot>
      <tr className="border-t-2 border-gray-100 bg-gray-50/60">
        <td colSpan={4} className="px-4 py-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
            Total del período
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex flex-col items-end gap-0.5">
            {/* Ingresos */}
            <span className="text-[11px] text-emerald-600 font-medium">
              +{formatCurrency(totalIncome, 'BOB')}
            </span>
            {/* Gastos */}
            <span className="text-[11px] text-rose-500 font-medium">
              -{formatCurrency(totalExpense, 'BOB')}
            </span>
            {/* Neto — separador visual */}
            <div className="w-full border-t border-gray-200 my-0.5" />
            <span className={cn(
              'text-sm font-semibold',
              net >= 0 ? 'text-emerald-600' : 'text-rose-500'
            )}>
              {net >= 0 ? '+' : ''}{formatCurrency(net, 'BOB')}
            </span>
          </div>
        </td>
        <td className="px-4 py-3" />
      </tr>
    </tfoot>
  )
}
