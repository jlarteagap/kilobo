
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp, Wallet, LucideIcon } from "lucide-react"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"

interface SummaryCardsProps {
  totalIncome: number
  totalExpense: number
  netIncome: number
  incomeTrend: number
  expenseTrend: number
}


// Subcomponente TrendBadge — se mantiene igual
function TrendBadge({ trend }: { trend: number }) {
  const isNeutral = trend === 0
  const isPositive = trend > 0

  if (isNeutral) return <span className="text-gray-500 text-xs font-medium">0%</span>

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
      {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(trend).toFixed(1)}%
    </span>
  )
}

interface SummaryCardProps {
  label: string
  value: string
  valueColor?: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  footer: React.ReactNode
}

function SummaryCard({
  label,
  value,
  valueColor = "text-gray-900",
  icon: Icon,
  iconBg,
  iconColor,
  footer,
}: SummaryCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <h3 className={`text-2xl font-bold mt-2 ${valueColor}`}>{value}</h3>
        </div>
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {footer}
      </div>
    </div>
  )
}

export function SummaryCards({
  totalIncome,
  totalExpense,
  netIncome,
  incomeTrend,
  expenseTrend,
}: SummaryCardsProps) {
  const cards = [
    {
      label: "Ingresos Totales",
      value: formatCurrency(totalIncome, "BOB"),
      icon: TrendingUp,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      footer: (
        <>
          <TrendBadge trend={incomeTrend} />
          <span className="text-gray-400 text-xs">vs periodo anterior</span>
        </>
      ),
    },
    {
      label: "Gastos Totales",
      value: formatCurrency(totalExpense, "BOB"),
      icon: TrendingDown,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      footer: (
        <>
          <TrendBadge trend={expenseTrend} />
          <span className="text-gray-400 text-xs">vs periodo anterior</span>
        </>
      ),
    },
    {
      label: "Balance Neto",
      value: formatCurrency(netIncome, "BOB"),
      valueColor: netIncome >= 0 ? "text-gray-900" : "text-red-600",
      icon: Wallet,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      footer: (
        <span className="text-gray-400 text-xs">Balance del periodo seleccionado</span>
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
