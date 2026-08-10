"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { CHART_COLORS } from "@/lib/config/chart-colors"
import type { Installment } from "@/types/credit"

interface AmortizationChartProps {
  installments: Installment[]
  currency: string
}

export function AmortizationChart({ installments, currency }: AmortizationChartProps) {
  const data = installments
    .filter((i) => i.number % Math.max(1, Math.floor(installments.length / 12)) === 0 || i.number === 1 || i.number === installments.length)
    .map((i) => ({
      name: `#${i.number}`,
      balance: i.remaining_balance,
      paid: i.remaining_balance <= 0 ? 100 : ((installments[0]?.remaining_balance ?? 0) - i.remaining_balance),
    }))

  if (data.length === 0) return null

  const maxBalance = Math.max(...data.map((d) => d.balance))

  return (
    <div className="bg-white rounded-[22px] p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      <h4 className="text-sm font-bold text-foreground tracking-[-0.01em] mb-4">
        Amortización
      </h4>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.positive} stopOpacity={0.15} />
                <stop offset="100%" stopColor={CHART_COLORS.positive} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
              axisLine={{ stroke: CHART_COLORS.grid }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrency(v, currency)}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                fontSize: '12px',
              }}
              formatter={(value: number) => [formatCurrency(value, currency), 'Saldo deudor']}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={CHART_COLORS.positive}
              strokeWidth={2}
              fill="url(#balanceGradient)"
              dot={false}
              activeDot={{ r: 4, fill: CHART_COLORS.positive }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-[#6E6E73]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded bg-[#4F6A35]" />
          <span>Saldo deudor</span>
        </div>
      </div>
    </div>
  )
}
