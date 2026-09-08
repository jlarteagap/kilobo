import { LucideIcon } from "lucide-react"

export type AccountType = "BANK" | "WALLET" | "CASH" | "CRYPTO" | "OTHER"
export type CurrencyType = "BOB" | "USD" | "BTC" | "ETH" | "USDT" | "XRP" | "BNB" | "USDC" | "OTHER"

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: CurrencyType   // tipado estricto, antes era string
  createdAt: Date
  updatedAt: Date
}

// Derivados del tipo base — sin duplicar campos manualmente
export type CreateAccountData = Pick<Account, "name" | "type" | "balance" | "currency">
export type UpdateAccountData = Partial<CreateAccountData>

// Origen de un cambio de balance — para trazar de dónde vino el movimiento
export type BalanceChangeSource =
  | "ACCOUNT"
  | "TRANSACTION"
  | "INVESTMENT"
  | "DEBT"

// Registro histórico de un cambio sobre el balance de una cuenta
export interface AccountBalanceChange {
  id: string
  user_id: string
  account_id: string
  previous_balance: number
  new_balance: number
  delta: number
  source: BalanceChangeSource
  createdAt: Date
}

export type AccountBalanceChangeData = Omit<
  AccountBalanceChange,
  "id" | "createdAt"
>

// Constantes de presentación — separadas de los tipos
export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "BANK",   label: "Banco" },
  { value: "WALLET", label: "Billetera Digital" },
  { value: "CASH",   label: "Efectivo" },
  { value: "CRYPTO", label: "Criptomoneda" },
  { value: "OTHER",  label: "Otro" },
]

export const CURRENCY_TYPES: { value: CurrencyType; label: string }[] = [
  { value: "USD",   label: "Dólares" },
  { value: "BOB",   label: "Bolivianos" },
  { value: "BTC",   label: "Bitcoin" },
  { value: "ETH",   label: "Ethereum" },
  { value: "USDT",  label: "Tether" },
  { value: "XRP",   label: "XRP" },
  { value: "BNB",   label: "BNB" },
  { value: "USDC",  label: "USDC" },
  { value: "OTHER", label: "Otro" },
]

export interface AssetSummary {
  name: string
  value: number
  color: string
  percent: number
  currency: CurrencyType
}

export interface CurrencyGroup {
  currency: CurrencyType   // tipado estricto, antes era string
  totalWealth: number
  assets: AssetSummary[]
  formattedTotal: string
}

export interface AssetDetail {
  id: string
  name: string
  category: string
  weight: string
  formattedValue: string
  icon: LucideIcon
  color: string
}