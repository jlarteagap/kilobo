import { Wallet, Landmark, Banknote, Bitcoin, PiggyBank } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { AccountType } from "@/types/account"

export function getAccountColors(hex: string) {
  return {
    backgroundColor: `${hex}18`,
    color: hex,
  }
}

export const accountIconMap: Record<AccountType, typeof Wallet> = {
  BANK:   Landmark,
  WALLET: Wallet,
  CASH:   Banknote,
  CRYPTO: Bitcoin,
  OTHER:  PiggyBank,
}

export function AccountCardSkeleton() {
  return (
    <div className="bg-white rounded-[22px] border border-zinc-200 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0 bg-zinc-100" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-28 rounded-full bg-zinc-100" />
          <Skeleton className="h-3 w-20 rounded-full bg-zinc-100" />
        </div>
      </div>
    </div>
  )
}