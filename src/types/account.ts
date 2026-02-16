import { z } from "zod"

export type AccountType = "BANK" | "WALLET" | "CASH" | "CRYPTO" | "DEBT" | "OTHER"
export type CurrencyType = "BOB" | "USD" | "BTC" | "ETH" | "USDT" | "XRP" | "BNB" | "USDC" | "OTHER"

export const accountSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  type: z.enum(["BANK", "WALLET", "CASH", "CRYPTO", "DEBT", "OTHER"]),
  balance: z.coerce.number().min(0, "El saldo no puede ser negativo"),
  currency: z.string().default("BOB"),
})

export type Account = z.infer<typeof accountSchema>

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "BANK", label: "Banco" },
  { value: "WALLET", label: "Billetera Digital" },
  { value: "CASH", label: "Efectivo" },
  { value: "CRYPTO", label: "Criptomoneda" },
  { value: "DEBT", label: "Deuda" },
  { value: "OTHER", label: "Otro" },
]

export const CURRENCIES_TYPES: { value: CurrencyType; label: string }[] = [
  { value: "USD", label: "Dólares" },
  { value: "BOB", label: "Bolivianos" },
  { value: "BTC", label: "Bitcoin" },
  { value: "ETH", label: "Ethereum" },
  { value: "USDT", label: "Tether" },
  { value: "XRP", label: "XRP" },
  { value: "BNB", label: "BNB" },
  { value: "USDC", label: "USDC" },
  { value: "OTHER", label: "Otro" },
]

export interface CreateAccountData {
  name: string
  type: AccountType
  balance: number
  currency: string
}
