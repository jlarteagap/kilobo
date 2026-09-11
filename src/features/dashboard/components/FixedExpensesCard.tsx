import { Link2, Receipt } from 'lucide-react'
import { formatCurrency } from '@/features/accounts/utils/account-display.utils'

interface FixedExpensesCardProps {
  fixedExpense: number
  variableExpense: number
  currency: string
}

export function FixedExpensesCard({
  fixedExpense,
  variableExpense,
  currency,
}: FixedExpensesCardProps) {
  const total = fixedExpense + variableExpense
  const fixedPct = total > 0 ? (fixedExpense / total) * 100 : 0
  const hasExpenses = total > 0

  return (
    <div className="bg-white rounded-[22px] p-5 flex flex-col gap-4"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-[-0.01em]">Gastos del mes</h3>
          <p className="text-[11px] text-[#6E6E73] mt-0.5">Fijos vs variables</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center">
          <Receipt className="w-4 h-4 text-[#6E6E73]" />
        </div>
      </div>

      {/* Totales */}
      {!hasExpenses ? (
        <div className="text-center py-4">
          <p className="text-2xl mb-1">📊</p>
          <p className="text-[12px] text-[#6E6E73]">Sin gastos este mes</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-100/70 rounded-xl px-3 py-2.5">
              <p className="text-[11px] text-[#6E6E73]/80 mb-0.5">Fijos</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {formatCurrency(fixedExpense, currency)}
              </p>
            </div>
            <div className="bg-zinc-100/70 rounded-xl px-3 py-2.5">
              <p className="text-[11px] text-[#6E6E73]/80 mb-0.5">Variables</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {formatCurrency(variableExpense, currency)}
              </p>
            </div>
          </div>

          {/* Barra de distribución */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-[#6E6E73] mb-1.5 font-medium">
              <span>Fijos {fixedPct.toFixed(0)}%</span>
              <span>{(100 - fixedPct).toFixed(0)}% Variables</span>
            </div>
            <div className="h-1.5 w-full bg-[rgba(0,0,0,0.06)] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#059669] rounded-full transition-all duration-500"
                style={{ width: `${fixedPct}%` }}
              />
              <div
                className="h-full bg-zinc-300 rounded-full transition-all duration-500"
                style={{ width: `${100 - fixedPct}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-[#6E6E73] flex items-center gap-1.5 pt-1 border-t border-border/40">
            <Link2 className="w-3 h-3" />
            Los gastos recurrentes se cuentan como fijos
          </p>
        </>
      )}
    </div>
  )
}