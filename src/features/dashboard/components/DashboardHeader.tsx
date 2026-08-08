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
      <p className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-[0.04em]">{label}</p>
      <div className="flex flex-col lg:flex-row lg:items-end gap-0.5 lg:gap-3">
        <p className={cn(
          'text-[22px] font-bold tracking-tight tabular-nums',
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
  currentMonthLabel:       string
  netWorth:                number
  monthlyStats:            { income: number; expense: number; net: number }
  trends:                  { income: number; expense: number; net: number }
  netWorthPositive:        boolean
  currencyBreakdown?:      CurrencyBreakdown[]
  totalInvestedFormatted?: string
}

export function DashboardHeader({
  currentMonthLabel,
  netWorth,
  monthlyStats,
  trends,
  netWorthPositive,
  currencyBreakdown,
  totalInvestedFormatted,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#6E6E73] uppercase tracking-[0.04em] capitalize">
          {currentMonthLabel}
        </p>
      </div>

      <div className="bg-white rounded-[22px] p-6"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-x-0 divide-y lg:divide-y-0 lg:divide-x divide-[rgba(0,0,0,0.06)]">
          <div className="pt-4 lg:pt-0 sm:first:pt-8 lg:first:pt-0">
            <StatItem
              label="Patrimonio neto"
              value={netWorth}
              currency="BOB"
              color={netWorthPositive ? 'text-[#4F6A35]' : 'text-[#B5543D]'}
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
              color={monthlyStats.net >= 0 ? 'text-[#4F6A35]' : 'text-[#B5543D]'}
            />
          </div>
        </div>

        {/* ── Multi-currency breakdown ── */}
        {currencyBreakdown && currencyBreakdown.length > 0 && (
          <div className="mt-5 pt-5 border-t border-[rgba(0,0,0,0.06)]">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {currencyBreakdown.map((c) => (
                <div key={c.currency} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#6E6E73] uppercase tracking-[0.04em]">
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
                <span className="text-[10px] font-bold text-[#5F7D42] uppercase tracking-[0.04em]">
                  Invertido
                </span>
                <span className="text-sm font-bold text-[#4F6A35] tabular-nums">
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
