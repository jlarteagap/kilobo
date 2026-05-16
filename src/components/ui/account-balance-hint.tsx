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
        isOverdraft ? "bg-rose-50 text-rose-500" : "bg-gray-50 text-gray-400"
      )}
    >
      <span>Balance disponible</span>
      <span className={cn("font-semibold", isOverdraft && "text-rose-600")}>
        {formatCurrency(account.balance, account.currency)}
        {isOverdraft ? (
          <span className="ml-1.5 font-normal">· insuficiente</span>
        ) : null}
      </span>
    </div>
  )
}
