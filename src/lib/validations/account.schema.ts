import { z } from "zod"

// Source of truth para los valores válidos — evita duplicar el enum
const ACCOUNT_TYPE_VALUES = ["BANK", "WALLET", "CASH", "CRYPTO", "DEBT", "OTHER"] as const
const CURRENCY_TYPE_VALUES = ["BOB", "USD", "BTC", "ETH", "USDT", "XRP", "BNB", "USDC", "OTHER"] as const

// Schema para crear — lo que el usuario envía desde el formulario
export const createAccountSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  type: z.enum(ACCOUNT_TYPE_VALUES, { message: "Tipo de cuenta inválido" }),
  balance: z.coerce.number().min(0, "El saldo no puede ser negativo"),
  currency: z.enum(CURRENCY_TYPE_VALUES, { message: "Moneda inválida" }).default("BOB"),
})

// Schema para actualizar — todos los campos opcionales
export const updateAccountSchema = createAccountSchema.partial()

// Tipos inferidos del schema — úsalos en formularios y API routes
export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>