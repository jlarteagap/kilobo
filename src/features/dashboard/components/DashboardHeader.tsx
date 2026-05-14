// features/dashboard/components/DashboardHeader.tsx
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"

interface StatItemProps {
  label:    string
  value:    number
  currency: string
  trend?:   number
  inverse?: boolean
  color?:   string
}

function StatItem({ label, value, currency, trend, inverse, color }: StatItemProps) {
  const isPositive = inverse ? (trend ?? 0) < 0 : (trend ?? 0) > 0
  const isNeutral  = trend === 0 || trend === undefined

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">{label}</p>
      <div className="flex flex-col lg:flex-row lg:items-end gap-0.5 lg:gap-3">
        <p className={cn(
          'text-2xl font-bold tracking-tight tabular-nums',
          color ?? 'text-foreground'
        )}>
          {formatCurrency(Math.abs(value), currency)}
        </p>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider lg:mb-1',
            isNeutral   ? 'text-muted-foreground/40' :
            isPositive  ? 'text-emerald-500' :
                          'text-rose-500'
          )}>
            {isNeutral
              ? <Minus className="w-3 h-3" />
              : isPositive
                ? <TrendingUp   className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
            }
            <span>
              {isNeutral ? 'Sin cambio' : `${(trend ?? 0) > 0 ? '+' : ''}${(trend ?? 0).toFixed(1)}%`}
            </span>
          </div>
        )}
      </div>
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
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          {greeting} 👋
        </h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-1 capitalize">
          {currentMonthLabel}
        </p>
      </div>

      {/* Stats Panel */}
      <div
        className="bg-card rounded-3xl p-6 border border-border/40"
        style={{ boxShadow: '0 4px 20px -4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.02)' }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-x-0 divide-y lg:divide-y-0 lg:divide-x divide-border/40">
          <div className="pt-4 lg:pt-0 sm:first:pt-8 lg:first:pt-0">
            <StatItem
              label="Patrimonio neto"
              value={netWorth}
              currency="BOB"
              color={netWorthPositive ? 'text-emerald-500' : 'text-rose-500'}
            />
          </div>
          <div className="pt-4 lg:pt-0 lg:pl-8">
            <StatItem
              label="Ingresos del mes"
              value={monthlyStats.income}
              currency="BOB"
              trend={trends.income}
            />
          </div>
          <div className="pt-4 lg:pt-0 lg:pl-8">
            <StatItem
              label="Gastos del mes"
              value={monthlyStats.expense}
              currency="BOB"
              trend={trends.expense}
              inverse
            />
          </div>
          <div className="pt-4 lg:pt-0 lg:pl-8">
            <StatItem
              label="Balance neto"
              value={monthlyStats.net}
              currency="BOB"
              trend={trends.net}
              color={monthlyStats.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}