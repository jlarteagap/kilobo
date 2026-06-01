import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, PiggyBank, Handshake, LucideIcon } from "lucide-react"
import { TransactionType } from "@/types/transaction"
import { Account } from "@/types/account"
import { Category } from "@/types/category"
import { parseLocalDate } from '@/lib/utils'
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Normaliza códigos de moneda legacy
export const normalizeCurrency = (currency: string): string => {
  return currency === "BS" ? "BOB" : currency
}

const transactionAmountColorMap: Record<TransactionType, string> = {
  INCOME:   "text-emerald-600",
  EXPENSE:  "text-rose-600",
  TRANSFER: "text-amber-600",
  SAVING:   "text-purple-600",
}

export const getTransactionAmountColor = (type: TransactionType): string =>
  transactionAmountColorMap[type] ?? "text-gray-900"

const transactionIconMap: Record<TransactionType, LucideIcon | null> = {
  INCOME:   ArrowDownLeft,
  EXPENSE:  ArrowUpRight,
  TRANSFER: ArrowRightLeft,
  SAVING:   PiggyBank,
}

export const getTransactionIcon = (type: TransactionType) => transactionIconMap[type]

const subtypeIconMap: Record<string, LucideIcon> = {
  'Préstamo':      Handshake,
  'Pago de deuda': Handshake,
}

export const getSubtypeIcon = (subtype: string | null | undefined): LucideIcon | null =>
  subtype ? (subtypeIconMap[subtype] ?? null) : null

// Prefijo de signo según tipo
export const getTransactionSign = (type: TransactionType): string => {
  if (type === 'TRANSFER') return ''
  return ['EXPENSE', 'SAVING'].includes(type) ? '-' : '+'
}

// Color de cuenta según tipo
// export const getAccountColor = (accountId: string | null, accounts: Account[]): string => {
//   if (!accountId) return "text-gray-600"
//   const account = accounts.find((a) => a.id === accountId)
//   return account?.type === "DEBT" ? "text-orange-600 font-semibold" : "text-gray-600"
// }

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
export function formatTransactionDate(dateStr: string): string {
  return format(parseLocalDate(dateStr), "d 'de' MMMM", { locale: es })
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  EXPENSE:  "Gasto",
  INCOME:   "Ingreso",
  TRANSFER: "Transferencia",
  SAVING:   "Ahorro",
}
