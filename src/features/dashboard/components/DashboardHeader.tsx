// features/dashboard/components/DashboardHeader.tsx
import { cn } from "@/lib/utils"
import { TrendBadge } from "@/components/ui/trend-badge"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import type { CurrencyBreakdown } from "@/features/accounts/hooks/useAccountsDashboard"

function StatItem({
  label,
  value,
  currency,
  trend,
  inverse,
  color,
}: {
  label:    string
  value:    number
  currency: string
  trend?:   number
  inverse?: boolean
  color?:   string
}) {
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
          <TrendBadge
            trend={trend}
            inverse={inverse}
            showComparison={false}
            className="text-[10px] font-bold uppercase tracking-wider lg:mb-1"
          />
        )}
      </div>
    </div>
  )
}

interface DashboardHeaderProps {
  greeting:                string
  currentMonthLabel:       string
  netWorth:                number
  monthlyStats:            { income: number; expense: number; net: number }
  trends:                  { income: number; expense: number; net: number }
  netWorthPositive:        boolean
  currencyBreakdown?:      CurrencyBreakdown[]
  totalInvestedFormatted?: string
}

export function DashboardHeader({
  greeting,
  currentMonthLabel,
  netWorth,
  monthlyStats,
  trends,
  netWorthPositive,
  currencyBreakdown,
  totalInvestedFormatted,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          {greeting} 👋
        </h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-1 capitalize">
          {currentMonthLabel}
        </p>
      </div>

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

        {/* ── Multi-currency breakdown ── */}
        {currencyBreakdown && currencyBreakdown.length > 0 && (
          <div className="mt-5 pt-5 border-t border-border/40">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {currencyBreakdown.map((c) => (
                <div key={c.currency} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                    {c.currency}
                  </span>
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {c.formattedBalance}
                  </span>
                </div>
              ))}
            </div>
            {totalInvestedFormatted && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                  Invertido
                </span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {totalInvestedFormatted}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}