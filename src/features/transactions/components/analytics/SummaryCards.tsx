// features/transactions/components/analytics/SummaryCards.tsx
import { TrendingDown, TrendingUp, Wallet, ArrowUp, ArrowDown, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"

// ─── TrendBadge ───────────────────────────────────────────────────────────────
function TrendBadge({ trend }: { trend: number }) {
  if (trend === 0) return (
    <span className="text-[12px] font-medium text-gray-400">0%</span>
  )

  const isPositive = trend > 0
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[12px] font-medium',
      isPositive ? 'text-emerald-600' : 'text-rose-500'
    )}>
      {isPositive
        ? <ArrowUp   className="w-3 h-3" />
        : <ArrowDown className="w-3 h-3" />
      }
      {Math.abs(trend).toFixed(1)}%
    </span>
  )
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────
interface SummaryCardProps {
  label:       string
  value:       string
  valueColor?: string
  icon:        LucideIcon
  iconBg:      string
  iconColor:   string
  footer:      React.ReactNode
}

function SummaryCard({
  label,
  value,
  valueColor = 'text-gray-900',
  icon: Icon,
  iconBg,
  iconColor,
  footer,
}: SummaryCardProps) {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col gap-4"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-gray-500">{label}</p>
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
      </div>

      {/* Valor */}
      <p className={cn('text-2xl font-semibold tracking-tight', valueColor)}>
        {value}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-gray-50">
        {footer}
      </div>
    </div>
  )
}

// ─── SummaryCards ─────────────────────────────────────────────────────────────
interface SummaryCardsProps {
  totalIncome:   number
  totalExpense:  number
  netIncome:     number
  incomeTrend:   number
  expenseTrend:  number
}

export function SummaryCards({
  totalIncome,
  totalExpense,
  netIncome,
  incomeTrend,
  expenseTrend,
}: SummaryCardsProps) {
  const cards: SummaryCardProps[] = [
    {
      label:      'Ingresos',
      value:      formatCurrency(totalIncome, 'BOB'),
      icon:       TrendingUp,
      iconBg:     'bg-emerald-50',
      iconColor:  'text-emerald-600',
      footer: (
        <>
          <TrendBadge trend={incomeTrend} />
          <span className="text-[11px] text-gray-400">vs período anterior</span>
        </>
      ),
    },
    {
      label:      'Gastos',
      value:      formatCurrency(totalExpense, 'BOB'),
      icon:       TrendingDown,
      iconBg:     'bg-rose-50',
      iconColor:  'text-rose-500',
      footer: (
        <>
          <TrendBadge trend={expenseTrend} />
          <span className="text-[11px] text-gray-400">vs período anterior</span>
        </>
      ),
    },
    {
      label:      'Balance neto',
      value:      formatCurrency(netIncome, 'BOB'),
      valueColor: netIncome >= 0 ? 'text-gray-900' : 'text-rose-500',
      icon:       Wallet,
      iconBg:     'bg-blue-50',
      iconColor:  'text-blue-500',
      footer: (
        <span className="text-[11px] text-gray-400">
          Balance del período seleccionado
        </span>
      ),
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </div>
  )
}