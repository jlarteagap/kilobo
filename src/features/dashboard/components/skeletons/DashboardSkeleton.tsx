import { AssetsSectionSkeleton } from "./AssetsSectionSkeleton"
import { CashflowSectionSkeleton } from "./CashflowSectionSkeleton"
import { AssetsTableSkeleton } from "./AssetsTableSkeleton"

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AssetsSectionSkeleton />
        <CashflowSectionSkeleton />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AssetsTableSkeleton />
      </div>
    </div>
  )
}