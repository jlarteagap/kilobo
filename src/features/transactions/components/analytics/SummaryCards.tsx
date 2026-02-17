
import { ArrowDown, ArrowUp, DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react"

interface SummaryCardsProps {
  totalIncome: number
  totalExpense: number
  netIncome: number
  incomeTrend: number
  expenseTrend: number
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount)
}

function TrendBadge({ trend }: { trend: number }) {
    const isPositive = trend > 0
    const isNeutral = trend === 0
    
    if (isNeutral) return <span className="text-gray-500 text-xs font-medium">0%</span>

    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}%
        </span>
    )
}

export function SummaryCards({ totalIncome, totalExpense, netIncome, incomeTrend, expenseTrend }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalIncome)}</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
            <TrendBadge trend={incomeTrend} />
            <span className="text-gray-400 text-xs">vs periodo anterior</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500">Gastos Totales</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalExpense)}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
            <TrendBadge trend={expenseTrend} />
            <span className="text-gray-400 text-xs">vs periodo anterior</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500">Balance Neto</p>
                <h3 className={`text-2xl font-bold mt-2 ${netIncome >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatCurrency(netIncome)}
                </h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
                <Wallet className="w-5 h-5 text-blue-600" />
            </div>
        </div>
        <div className="mt-4">
             {/* Net income doesn't have a direct "trend" prop passed but we can infer or leave empty */}
             <span className="text-gray-400 text-xs">Balance del periodo seleccionado</span>
        </div>
      </div>
    </div>
  )
}
