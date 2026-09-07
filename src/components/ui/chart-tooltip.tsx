import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"

function ChartTooltipContainer({
  active,
  payload,
  children,
}: {
  active?: boolean
  payload?: unknown[]
  children: ReactNode
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="bg-white px-3.5 py-3 rounded-xl text-sm min-w-[160px] border border-zinc-200"
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
    >
      {children}
    </div>
  )
}

function ChartTooltipRow({
  color,
  label,
  value,
  currency = "BOB",
  muted,
}: {
  color: string
  label: string
  value: number
  currency?: string
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className={cn("text-[12px] truncate", muted ? "text-muted-foreground opacity-70" : "text-[#6E6E73]")}>
          {label}
        </span>
      </div>
      <span className={cn("text-[12px] font-semibold shrink-0", muted ? "text-muted-foreground" : "text-foreground")}>
        {formatCurrency(value, currency)}
      </span>
    </div>
  )
}

export { ChartTooltipContainer, ChartTooltipRow }
