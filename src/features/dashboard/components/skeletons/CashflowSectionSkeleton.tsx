import { Skeleton } from "@/components/ui/skeleton"

export function CashflowSectionSkeleton() {
  return (
    <div className="bg-white rounded-[22px] border border-zinc-200 p-6 md:p-7 w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-lg bg-zinc-100" />
          <Skeleton className="h-3 w-24 rounded-lg bg-zinc-100" />
        </div>
        <Skeleton className="h-9 w-44 rounded-xl bg-zinc-100" />
      </div>
      <Skeleton className="h-[360px] w-full rounded-xl bg-zinc-100" />
      <div className="flex gap-4 mt-5 pt-5 border-t border-zinc-100">
        <Skeleton className="h-3 w-20 rounded-full bg-zinc-100" />
        <Skeleton className="h-3 w-20 rounded-full bg-zinc-100" />
        <Skeleton className="h-3 w-20 rounded-full bg-zinc-100" />
      </div>
    </div>
  )
}