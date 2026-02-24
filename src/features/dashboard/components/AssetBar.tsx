// features/accounts/components/AssetBar.tsx
import { AssetSummary } from "@/types/account"

export function AssetBar({ assets }: { assets: AssetSummary[] }) {
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
      {assets.map((asset) => (
        <div
          key={asset.name}
          className="transition-all duration-500"
          style={{
            width:           `${asset.percent}%`,
            backgroundColor: asset.color,
          }}
        />
      ))}
    </div>
  )
}