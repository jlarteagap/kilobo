import { AssetSummary } from "@/types/account"

interface AssetLegendProps {
  assets: AssetSummary[]
}

export function AssetLegend({ assets }: AssetLegendProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {assets.map((asset) => (
        <div key={asset.name} className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${asset.color}`} />
          <span className="text-sm text-gray-600">{asset.name}</span>
          <span className="text-sm font-semibold text-gray-900">
            {asset.percent}%
          </span>
        </div>
      ))}
    </div>
  )
}