import { Account, AccountType, CURRENCY_TYPES, CurrencyType, ACCOUNT_TYPES } from "@/types/account"
import { Wallet, Building2, Banknote, Bitcoin, PiggyBank, LucideIcon, Landmark, CircleEllipsis } from "lucide-react"
import { convertToBOB } from "@/lib/config/exchange-rates"

const accountTypeDetailsMap: Record<AccountType, { label: string; icon: LucideIcon; color: string; bg: string }> = {
  BANK:   { label: "Banco",             icon: Building2,  color: "#4A6FA5", bg: "#4A6FA5" },
  WALLET: { label: "Billetera Digital", icon: Wallet,     color: "#8B7EA8", bg: "#8B7EA8" },
  CASH:   { label: "Efectivo",          icon: Banknote,   color: "#4F6A35", bg: "#4F6A35" },
  CRYPTO: { label: "Cripto",            icon: Bitcoin,    color: "#C08A2E", bg: "#C08A2E" },
  OTHER:  { label: "Otro",              icon: PiggyBank,  color: "#837A75", bg: "#837A75" },
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