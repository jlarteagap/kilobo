import { z } from "zod"

export type AccountType = "BANK" | "WALLET" | "CASH" | "CRYPTO" | "OTHER"

export const accountSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  type: z.enum(["BANK", "WALLET", "CASH", "CRYPTO", "OTHER"]),
  balance: z.coerce.number().min(0, "El saldo no puede ser negativo"),
  currency: z.string().default("USD"),
})

export type Account = z.infer<typeof accountSchema>

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "BANK", label: "Banco" },
  { value: "WALLET", label: "Billetera Digital" },
  { value: "CASH", label: "Efectivo" },
  { value: "CRYPTO", label: "Criptomoneda" },
  { value: "OTHER", label: "Otro" },
]
