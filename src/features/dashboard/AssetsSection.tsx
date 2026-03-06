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
        className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-2 min-h-[200px]"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xl">
          🏦
        </div>
        <p className="text-[13px] text-gray-400">Sin cuentas registradas</p>
        <p className="text-[11px] text-gray-300">Crea una cuenta para ver tu patrimonio</p>
      </div>
    )
  }

  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* ── Header ── */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-700">Patrimonio neto</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {groups.length} moneda{groups.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Grupos por moneda ── */}
      <div className="space-y-6">
        {groups.map((group, index) => (
          <Fragment key={group.currency}>
            {/* Separador entre grupos */}
            {index > 0 ? (
              <div className="border-t border-gray-50" />
            ) : null}

            <div className="space-y-4">
              {/* Total por moneda */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  {getCurrencyLabel(group.currency)}
                </span>
                <span className="text-lg font-semibold text-gray-900 tracking-tight">
                  {group.formattedTotal}
                </span>
              </div>

              {/* Barra + Leyenda */}
              <AssetBar    assets={group.assets} />
              <AssetLegend assets={group.assets} />
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}