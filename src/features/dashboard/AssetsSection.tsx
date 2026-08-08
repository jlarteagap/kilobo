// features/accounts/AssetsSection.tsx
"use client"

import { Fragment } from "react"
import { getCurrencyLabel } from "../accounts/utils/account-display.utils"
import { AssetBar } from "./components/AssetBar"
import { AssetLegend } from "./components/AssetLegend"
import type { CurrencyGroup } from "@/types/account"

interface AssetsSectionProps {
  groups: CurrencyGroup[]
}

export function AssetsSection({ groups }: AssetsSectionProps) {
  // ── Empty state ──────────────────────────────────────────────────────────────
  if (groups.length === 0) {
    return (
      <div
        className="bg-white rounded-[22px] p-5 flex flex-col items-center justify-center gap-2 min-h-[200px]"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
      >
        <div className="w-10 h-10 rounded-2xl bg-[#F2F9E3] flex items-center justify-center text-xl">
          🏦
        </div>
        <p className="text-[13px] text-[#6E6E73]">Sin cuentas registradas</p>
        <p className="text-[11px] text-[#6E6E73]/60">Crea una cuenta para ver tu patrimonio</p>
      </div>
    )
  }

  return (
    <div
      className="bg-card rounded-[22px] p-6"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
    >
      {/* ── Header ── */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-foreground tracking-[-0.01em]">Patrimonio neto</h3>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          Consolidado en {groups.length} divisa{groups.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Grupos por moneda ── */}
      <div className="space-y-8">
        {groups.map((group, index) => (
          <Fragment key={group.currency}>
            {/* Separador sutil */}
            {index > 0 ? (
              <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            ) : null}

            <div className="space-y-5">
              {/* Total por moneda */}
              <div className="flex items-end justify-between">
                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                  {getCurrencyLabel(group.currency)}
                </span>
                <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
                  {group.formattedTotal}
                </span>
              </div>

              {/* Barra + Leyenda */}
              <div className="space-y-4">
                <AssetBar assets={group.assets} />
                <AssetLegend assets={group.assets} />
              </div>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}