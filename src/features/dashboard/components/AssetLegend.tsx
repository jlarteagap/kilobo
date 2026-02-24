// features/accounts/components/AssetLegend.tsx
import { AssetSummary } from "@/types/account"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"

export function AssetLegend({ assets }: { assets: AssetSummary[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {assets.map((asset) => (
        <div key={asset.name} className="flex items-center gap-2.5">
          {/* Dot de color */}
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: asset.color }}
          />
          {/* Nombre */}
          <span className="text-[13px] text-gray-600 flex-1 truncate">
            {asset.name}
          </span>
          {/* Porcentaje */}
          <span className="text-[12px] text-gray-400 font-medium">
            {asset.percent.toFixed(1)}%
          </span>
          {/* Valor */}
          <span className="text-[13px] font-semibold text-gray-700 min-w-[80px] text-right">
            {formatCurrency(asset.value, asset.currency)}
          </span>
        </div>
      ))}
    </div>
  )
}