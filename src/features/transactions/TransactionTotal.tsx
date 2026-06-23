import { Transaction } from "@/types/transaction"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { convertToBOB } from "@/lib/config/exchange-rates"
import { cn } from "@/lib/utils"

export function TransactionTotals({ transactions }: { transactions: Transaction[] }) {
  const totalIncome  = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + convertToBOB(t.amount, t.currency), 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + convertToBOB(t.amount, t.currency), 0)

  const net = totalIncome - totalExpense

  return (
    <tfoot>
      <tr className="border-t-2 border-gray-100 bg-gray-50/60">
        {/* Etiqueta */}
        <td className="px-4 py-3">
          <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
            Total del período
          </span>
        </td>

        {/* Celdas vacías para columnas ocultas en móvil (Tags, Tipo, Cuenta) */}
        <td className="hidden sm:table-cell px-4 py-3" />
        <td className="hidden sm:table-cell px-4 py-3" />
        <td className="hidden md:table-cell px-4 py-3" />

        {/* Totales */}
        <td className="px-4 py-3 text-right">
          <div className="flex flex-col items-end gap-0.5">
            {/* Ingresos */}
            <span className="text-[10px] sm:text-[11px] text-emerald-600 font-medium whitespace-nowrap">
              +{formatCurrency(totalIncome, 'BOB')}
            </span>
            {/* Gastos */}
            <span className="text-[10px] sm:text-[11px] text-rose-500 font-medium whitespace-nowrap">
              -{formatCurrency(totalExpense, 'BOB')}
            </span>
            {/* Neto — separador visual */}
            <div className="w-16 sm:w-full border-t border-gray-200 my-0.5" />
            <span className={cn(
              'text-xs sm:text-sm font-bold',
              net >= 0 ? 'text-emerald-600' : 'text-rose-500'
            )}>
              {net >= 0 ? '+' : ''}{formatCurrency(net, 'BOB')}
            </span>
          </div>
        </td>

        {/* Celda para Acciones */}
        <td className="px-4 py-3" />
      </tr>
    </tfoot>
  )
}
