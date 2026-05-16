import { Account, AccountType, CURRENCY_TYPES, CurrencyType, ACCOUNT_TYPES } from "@/types/account"
import { Wallet, Building2, Banknote, Bitcoin, PiggyBank, LucideIcon, Landmark, CircleEllipsis } from "lucide-react"
import { convertToBOB } from "@/lib/config/exchange-rates"

const accountTypeDetailsMap: Record<AccountType, { label: string; icon: LucideIcon; color: string; bg: string }> = {
  BANK:   { label: "Banco",             icon: Building2,  color: "text-blue-500",      bg: "bg-blue-500" },
  WALLET: { label: "Billetera Digital", icon: Wallet,     color: "text-purple-500",    bg: "bg-purple-500" },
  CASH:   { label: "Efectivo",          icon: Banknote,   color: "text-emerald-500",   bg: "bg-emerald-500" },
  CRYPTO: { label: "Cripto",            icon: Bitcoin,    color: "text-orange-500",    bg: "bg-orange-500" },
  OTHER:  { label: "Otro",              icon: PiggyBank,  color: "text-gray-500",      bg: "bg-gray-500" },
}

export const getAccountTypeDetails = (type: AccountType) => accountTypeDetailsMap[type]

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

const accountIconMap: Record<AccountType, LucideIcon> = {
  BANK:   Landmark,
  WALLET: Wallet,
  CASH:   Banknote,
  CRYPTO: Bitcoin,
  OTHER:  CircleEllipsis,
}

export const getAccountIcon = (type: AccountType): LucideIcon => accountIconMap[type]

export const getTypeLabel = (type: string) => {
  return ACCOUNT_TYPES.find(t => t.value === type)?.label || type
}