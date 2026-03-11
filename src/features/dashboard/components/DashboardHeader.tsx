// features/dashboard/components/DashboardHeader.tsx
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"

interface StatCardProps {
  label:    string
  value:    number
  currency: string
  trend?:   number
  inverse?: boolean
  color?:   string
}

function StatCard({ label, value, currency, trend, inverse, color }: StatCardProps) {
  const isPositive = inverse ? (trend ?? 0) < 0 : (trend ?? 0) > 0
  const isNeutral  = trend === 0 || trend === undefined

  return (
    <div
      className="bg-white rounded-2xl px-5 py-4 flex flex-col gap-2"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <p className="text-[12px] font-medium text-gray-400">{label}</p>
      <p className={cn(
        'text-xl font-semibold tracking-tight',
        color ?? 'text-gray-900'
      )}>
        {formatCurrency(Math.abs(value), currency)}
      </p>
      {trend !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-[11px] font-medium',
          isNeutral   ? 'text-gray-400' :
          isPositive  ? 'text-emerald-600' :
                        'text-rose-500'
        )}>
          {isNeutral
            ? <Minus className="w-3 h-3" />
            : isPositive
              ? <TrendingUp   className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
          }
          <span>
            {isNeutral ? 'Sin cambio' : `${(trend ?? 0) > 0 ? '+' : ''}${(trend ?? 0).toFixed(1)}% vs mes anterior`}
          </span>
        </div>
      )}
    </div>
  )
}

interface DashboardHeaderProps {
  greeting:           string
  currentMonthLabel:  string
  netWorth:           number
  monthlyStats:       { income: number; expense: number; net: number }
  trends:             { income: number; expense: number; net: number }
  netWorthPositive:   boolean
}

export function DashboardHeader({
  greeting,
  currentMonthLabel,
  netWorth,
  monthlyStats,
  trends,
  netWorthPositive,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-5">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          {greeting} 👋
        </h1>
        <p className="text-[13px] text-gray-400 mt-0.5 capitalize">
          {currentMonthLabel}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Patrimonio neto"
          value={netWorth}
          currency="BOB"
          color={netWorthPositive ? 'text-emerald-600' : 'text-rose-500'}
        />
        <StatCard
          label="Ingresos del mes"
          value={monthlyStats.income}
          currency="BOB"
          trend={trends.income}
        />
        <StatCard
          label="Gastos del mes"
          value={monthlyStats.expense}
          currency="BOB"
          trend={trends.expense}
          inverse
        />
        <StatCard
          label="Balance neto"
          value={monthlyStats.net}
          currency="BOB"
          trend={trends.net}
          color={monthlyStats.net >= 0 ? 'text-emerald-600' : 'text-rose-500'}
        />
      </div>
    </div>
  )
}