import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, PiggyBank, CreditCard } from "lucide-react"
import { TransactionType } from "@/types/transaction"
import { Account } from "@/types/account"
import { Category } from "@/types/category"
import { TRANSACTION_TYPES } from "@/lib/validations/transaction.schema"

// Normaliza códigos de moneda legacy
export const normalizeCurrency = (currency: string): string => {
  return currency === "BS" ? "BOB" : currency
}

// Color del monto según tipo de transacción
export const getTransactionAmountColor = (type: TransactionType): string => {
  switch (type) {
    case "INCOME":   return "text-emerald-600"
    case "EXPENSE":  return "text-rose-600"
    case "TRANSFER": return "text-blue-600"
    case "SAVING":   return "text-purple-600"
    case "DEBT":     return "text-orange-600"
    default:         return "text-gray-900"
  }
}

// Icono según tipo de transacción
export const getTransactionIcon = (type: TransactionType) => {
  switch (type) {
    case "INCOME":   return ArrowDownLeft
    case "EXPENSE":  return ArrowUpRight
    case "TRANSFER": return ArrowRightLeft
    case "SAVING":   return PiggyBank
    case "DEBT":     return CreditCard
    default:         return null
  }
}

// Prefijo de signo según tipo
export const getTransactionSign = (type: TransactionType): string => {
  return ["EXPENSE", "SAVING", "DEBT"].includes(type) ? "-" : "+"
}

// Color de cuenta según tipo
export const getAccountColor = (accountId: string | null, accounts: Account[]): string => {
  if (!accountId) return "text-gray-600"
  const account = accounts.find((a) => a.id === accountId)
  return account?.type === "DEBT" ? "text-orange-600 font-semibold" : "text-gray-600"
}

// Nombre de cuenta
export const getAccountName = (accountId: string | null, accounts: Account[]): string => {
  if (!accountId) return ""
  return accounts.find((a) => a.id === accountId)?.name ?? accountId
}

// Nombre de categoría con jerarquía padre → hijo
export const getCategoryDisplay = (
  categoryId: string | null,
  categories: Category[]
): { parent: string | null; name: string } => {
  if (!categoryId) return { parent: null, name: "" }

  const category = categories.find((c) => c.id === categoryId)
  if (!category) return { parent: null, name: categoryId }

  if (category.parent_id) {
    const parent = categories.find((c) => c.id === category.parent_id)
    if (parent) return { parent: parent.name, name: category.name }
  }

  return { parent: null, name: category.name }
}

// Formatea fecha en español Bolivia
export const formatTransactionDate = (date: string): string => {
  return new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export const TRANSACTION_TYPE_LABELS: Record<typeof TRANSACTION_TYPES[number], string> = {
  EXPENSE:  "Gasto",
  INCOME:   "Ingreso",
  TRANSFER: "Transfer",
  SAVING:   "Ahorro",
  DEBT:     "Deuda",
}