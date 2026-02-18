import { AssetSummary } from "@/types/account"

interface AssetBarProps {
  assets: AssetSummary[]
}

export function AssetBar({ assets }: AssetBarProps) {
  return (
    <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
      {assets.map((asset) => (
        <div
          key={asset.name}
          className={asset.color}
          style={{ width: `${asset.percent}%` }}
          title={`${asset.name}: ${asset.percent}%`}
        />
      ))}
    </div>
  )
}