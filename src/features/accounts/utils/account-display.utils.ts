import { Account, AccountType } from "@/types/account"
import { Wallet, Building2, Banknote, Bitcoin, CreditCard, PiggyBank, LucideIcon } from "lucide-react"
import { convertToBOB } from "@/lib/config/exchange-rates"
import { CURRENCY_TYPES, CurrencyType } from "@/types/account"

export const getAccountTypeDetails = (
  type: AccountType
): { label: string; icon: LucideIcon; color: string; bg: string } => {
  switch (type) {
    case "BANK":
      return { label: "Banco", icon: Building2, color: "text-blue-500", bg: "bg-blue-500" }
    case "WALLET":
      return { label: "Billetera Digital", icon: Wallet, color: "text-purple-500", bg: "bg-purple-500" }
    case "CASH":
      return { label: "Efectivo", icon: Banknote, color: "text-emerald-500", bg: "bg-emerald-500" }
    case "CRYPTO":
      return { label: "Cripto", icon: Bitcoin, color: "text-orange-500", bg: "bg-orange-500" }
    case "DEBT":
      return { label: "Deuda", icon: CreditCard, color: "text-red-500", bg: "bg-red-500" }
    default:
      return { label: "Otro", icon: PiggyBank, color: "text-gray-500", bg: "bg-gray-500" }
  }
}

export const formatCurrency = (value: number, currency: string): string => {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "BOB",
    minimumFractionDigits: 2,
  }).format(value)
}

export const getValueInBOB = (account: Account): number => {
  return convertToBOB(account.balance, account.currency)
}

export const getCurrencyLabel = (currency: CurrencyType | string): string => {
  return CURRENCY_TYPES.find((c) => c.value === currency)?.label ?? currency
}