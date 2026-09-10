// features/accounts/components/AccountChangeBadge.tsx
// Badge "Minimal · Zinc" de variación diaria del balance de una cuenta.
// Estado 1: delta ≠ 0 → pill firmado ("+8 · Hoy") emerald/zinc.
// Estado 2: delta === 0 con último cambio de un periodo anterior → pill neutro
//           "Sin cambios · hace X" (aviso, nunca "+0"). Si el último cambio es
//           de hoy, no se muestra ningún punto (actividad reciente descarta el aviso).
// Estado 3: sin ancla (sin historial previo al periodo) → sin badge (no se renderiza).
// Solo tema claro (ver DESIGN-MANUAL §11).
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "../utils/relative-time.utils"
import { formatChangeAmount, formatAssetAmount } from "../utils/account-display.utils"
import { startOfDailyPeriod } from "../utils/daily-period.utils"

export function AccountChangeBadge({
  delta,
  anchorBalance,
  lastChangeAt,
  currency = "BOB",
  className,
}: {
  delta: number | null
  anchorBalance: number | null
  lastChangeAt: Date | null
  currency?: string
  className?: string
}) {
  if (delta === null || anchorBalance === null) return null

  if (delta === 0) {
    // El aviso "Sin cambios" solo vale cuando el último movimiento es de un
    // periodo anterior. Actividad registrada hoy descarta el punto neutro.
    if (lastChangeAt && lastChangeAt >= startOfDailyPeriod()) return null
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums leading-none bg-zinc-900/[0.04] text-[#6E6E73]",
          className
        )}
        title="Sin movimientos en el periodo actual"
      >
        Sin cambios
        {lastChangeAt && (
          <span aria-hidden="true" className="opacity-70">
            · {formatRelativeTime(lastChangeAt)}
          </span>
        )}
      </span>
    )
  }

  const up = delta > 0

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums leading-none",
        up ? "bg-[#059669]/10 text-[#047857]" : "bg-zinc-900/[0.06] text-[#27272A]",
        className
      )}
      title={`Variación de hoy (desde las 4:00) vs el cierre de ayer: ${formatAssetAmount(
        anchorBalance,
        currency
      )}`}
    >
      <span aria-hidden="true" className={cn("font-semibold", up ? "text-[#059669]" : "text-zinc-500")}>
        {up ? "+" : "-"}
      </span>
      {formatChangeAmount(delta)}
      <span aria-hidden="true" className="font-medium opacity-70">Hoy</span>
    </span>
  )
}