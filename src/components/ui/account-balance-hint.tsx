"use client"

import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"

interface Account {
  id: string
  balance: number
  currency: string
}

interface AccountBalanceHintProps {
  accountId: string | undefined
  amount: number
  accounts: Account[]
  showBalance?: boolean
}

export function AccountBalanceHint({
  accountId,
  amount,
  accounts,
  showBalance = true,
}: AccountBalanceHintProps) {
  if (!accountId) return null

  const account = accounts.find((a) => a.id === accountId)
  if (!account) return null

  const isOverdraft = showBalance && amount > account.balance

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-xl text-[12px] transition-all duration-200",
        isOverdraft ? "bg-[#FAEDE9] text-[#B5543D]" : "bg-[#F2F9E3]/40 text-[#6E6E73]"
      )}
    >
      <span>Balance disponible</span>
      <span className={cn("font-semibold", isOverdraft && "text-[#B5543D]")}>
        {formatCurrency(account.balance, account.currency)}
        {isOverdraft ? (
          <span className="ml-1.5 font-normal">· insuficiente</span>
        ) : null}
      </span>
    </div>
  )
}
