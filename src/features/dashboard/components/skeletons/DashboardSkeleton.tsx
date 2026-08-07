import { Skeleton } from "@/components/ui/skeleton"

function HeaderCardSkeleton() {
  return (
    <div className="bg-white card-organic border border-[#E5DED2] p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CashflowCardSkeleton() {
  return (
    <div className="bg-white card-organic border border-[#E5DED2] p-6">
      <div className="mb-4">
        <Skeleton className="h-4 w-36 rounded-full" />
        <Skeleton className="h-3 w-20 rounded-full mt-1.5" />
      </div>
      <Skeleton className="h-[280px] w-full rounded-xl" />
    </div>
  )
}

function RailCardSkeleton() {
  return (
    <div className="bg-white card-organic border border-[#E5DED2] p-5 space-y-3">
      <Skeleton className="h-3 w-28 rounded-full" />
      <Skeleton className="h-4 w-20 rounded-full" />
      <Skeleton className="h-[160px] w-full rounded-xl" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 container mx-auto max-w-7xl py-6 md:py-8 px-4 sm:px-6">
      <HeaderCardSkeleton />
      <CashflowCardSkeleton />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Principal 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white card-organic border border-[#E5DED2] p-5 space-y-3">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
            <div className="md:col-span-2 bg-white card-organic border border-[#E5DED2] p-5 space-y-3">
              <Skeleton className="h-3 w-32 rounded-full" />
              <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
          </div>
          <div className="bg-white card-organic border border-[#E5DED2] p-5 space-y-3">
            <Skeleton className="h-3 w-32 rounded-full" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
          <div className="bg-white card-organic border border-[#E5DED2] p-5 space-y-3">
            <Skeleton className="h-3 w-36 rounded-full" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>

        {/* Rail 1/3 */}
        <aside className="flex flex-col gap-6 md:gap-8">
          <RailCardSkeleton />
          <RailCardSkeleton />
          <div className="bg-[#5F7D42] card-organic p-5 space-y-3">
            <Skeleton className="h-3 w-28 rounded-full bg-white/20" />
            <Skeleton className="h-4 w-20 rounded-full bg-white/20" />
            <Skeleton className="h-[120px] w-full rounded-xl bg-white/20" />
          </div>
        </aside>
      </div>
    </div>
  )
}
