import { TrendingUp, LucideIcon } from "lucide-react"
import { Investment } from "@/types/investment"
import { formatAssetAmount } from "@/features/accounts/utils/account-display.utils"
import { convertToBOB } from "@/lib/config/exchange-rates"

export const INVESTMENT_ICON: LucideIcon = TrendingUp

export const INVESTMENT_COLOR = {
  text: "text-indigo-600",
  bg: "bg-indigo-50",
  badge: "bg-indigo-100 text-indigo-700",
  hex: "#6366f1",
}

export function formatInvestmentDate(dateStr: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr + "T12:00:00"))
}

export function getTotalInvested(investments: Investment[]): number {
  return investments.reduce((sum, inv) => sum + inv.amount, 0)
}

export function getTotalInvestedByCurrency(investments: Investment[]): Record<string, number> {
  return investments.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.currency] = (acc[inv.currency] ?? 0) + inv.amount
    return acc
  }, {})
}

export function formatTotalInvested(investments: Investment[]): string {
  const byCurrency = getTotalInvestedByCurrency(investments)
  return Object.entries(byCurrency)
    .map(([currency, amount]) => formatAssetAmount(amount, currency))
    .join(" · ")
}

export function getTotalInvestedInBOB(investments: Investment[]): number {
  return investments.reduce((sum, inv) => sum + convertToBOB(inv.amount, inv.currency), 0)
}
