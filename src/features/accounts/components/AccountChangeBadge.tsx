// features/accounts/components/AccountChangeBadge.tsx
// Badge "Minimal · Zinc" del último cambio de balance de una cuenta.
// Subida → acento emerald; baja → zinc. Solo tema claro (ver DESIGN-MANUAL §11).
import { cn } from "@/lib/utils"
import type { AccountBalanceChange } from "@/types/account"
import { formatRelativeTime } from "../utils/relative-time.utils"
import { formatChangeAmount } from "../utils/account-display.utils"

export function AccountChangeBadge({
  change,
  className,
}: {
  change: AccountBalanceChange
  className?: string
}) {
  if (!change || change.delta === 0) return null

  const up = change.delta > 0
  const period = formatRelativeTime(change.createdAt)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums leading-none",
        up ? "bg-[#059669]/10 text-[#047857]" : "bg-zinc-900/[0.06] text-[#27272A]",
        className
      )}
      title={`Último cambio: ${formatChangeAmount(change.delta)} · ${period}`}
    >
      <span aria-hidden="true" className={cn("font-semibold", up ? "text-[#059669]" : "text-zinc-500")}>
        {up ? "+" : "-"}
      </span>
      {formatChangeAmount(Math.abs(change.delta))}
      <span aria-hidden="true" className="font-medium opacity-70">
        {period}
      </span>
    </span>
  )
}