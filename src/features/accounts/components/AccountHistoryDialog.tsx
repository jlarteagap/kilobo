// features/accounts/components/AccountHistoryDialog.tsx
// Diálogo "Minimal · Zinc" del historial reciente de cambios de balance de una
// cuenta. Separa las entradas del periodo actual (desde el límite del día,
// 4:00 AM local) del cierre del día anterior (ancla).
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Account, AccountBalanceChange } from "@/types/account"
import { useAccountBalanceHistory } from "../hooks/useAccountBalanceHistory"
import { sourceLabel } from "../utils/source-label.utils"
import { formatAssetAmount, formatChangeAmount, formatAbsoluteDateTime } from "../utils/account-display.utils"
import { startOfDailyPeriod } from "../utils/daily-period.utils"

function HistoryRow({ change, currency }: { change: AccountBalanceChange; currency: string }) {
  const up = change.delta > 0
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-foreground truncate">
          {sourceLabel(change.source)}
        </p>
        <p className="text-[11px] font-medium text-[#6E6E73] mt-0.5">
          {formatAbsoluteDateTime(change.createdAt)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn(
          "text-[13px] font-bold tabular-nums",
          up ? "text-[#047857]" : "text-[#27272A]"
        )}>
          <span aria-hidden="true" className="font-semibold">
            {up ? "+" : deltaSign(change.delta)}
          </span>
          {formatChangeAmount(change.delta)}
        </p>
        <p className="text-[11px] font-medium text-[#6E6E73] tabular-nums mt-0.5">
          {formatAssetAmount(change.previous_balance, currency)} →{" "}
          {formatAssetAmount(change.new_balance, currency)}
        </p>
      </div>
    </div>
  )
}

function deltaSign(delta: number): string {
  return delta < 0 ? "-" : ""
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-20 rounded-full" />
            <Skeleton className="h-2.5 w-14 rounded-full" />
          </div>
          <div className="space-y-1.5 text-right">
            <Skeleton className="h-3.5 w-14 rounded-full ml-auto" />
            <Skeleton className="h-2.5 w-20 rounded-full ml-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AccountHistoryDialog({
  account,
  open,
  onOpenChange,
  anchorBalance = null,
}: {
  account: Account | null
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorBalance?: number | null
}) {
  const { data: changes = [], isLoading, isError } = useAccountBalanceHistory(open ? account?.id ?? null : null)

  const boundary = startOfDailyPeriod()
  const todayRows = changes.filter((change) => change.createdAt >= boundary)
  const earlierRows = changes.filter((change) => change.createdAt < boundary)
  const currency = account?.currency ?? "BOB"

  return (
    <Dialog open={open && !!account} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[22px] p-0 overflow-hidden">
        <div className="p-6 pb-4 border-b border-[rgba(0,0,0,0.05)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {account?.name}
            </DialogTitle>
            <DialogDescription className="text-[#6E6E73] text-[12px] font-medium mt-1">
              {account
                ? `Historial de cambios · ${formatAssetAmount(account.balance, currency)}`
                : "Historial de cambios"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 max-h-[420px] overflow-y-auto">
          {isLoading || !account ? (
            <HistorySkeleton />
          ) : isError ? (
            <p className="text-[13px] font-medium text-[#B5543D] py-4 text-center">
              No se pudo cargar el historial.
            </p>
          ) : changes.length === 0 ? (
            <p className="text-[13px] font-medium text-[#6E6E73] py-8 text-center">
              Sin historial de cambios aún.
            </p>
          ) : (
            <div className="divide-y divide-[rgba(0,0,0,0.05)]">
              {todayRows.map((change) => (
                <HistoryRow key={change.id} change={change} currency={currency} />
              ))}

              {todayRows.length > 0 && earlierRows.length > 0 && (
                <div className="pt-3 pb-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6E6E73]">
                    Cierre de ayer{anchorBalance !== null ? `: ${formatAssetAmount(anchorBalance, currency)}` : ""}
                  </p>
                </div>
              )}

              {earlierRows.map((change) => (
                <HistoryRow key={change.id} change={change} currency={currency} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}