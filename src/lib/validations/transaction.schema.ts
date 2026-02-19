import { z } from "zod"

export const TRANSACTION_TYPES = ["INCOME", "EXPENSE", "TRANSFER", "SAVING", "DEBT"] as const
export const PAYMENT_METHODS = ["CASH", "QR", "CARD", "TRANSFER", "OTHER"] as const
// Reusing currency values from account schema or defining here. 
// Assuming independent definition for now or I could import from account.schema if exported.
// But to avoid circular deps or tight coupling locally, I'll redefine or just use string for now if not strict?
// The user's account schema had: ["BOB", "USD", "BTC", "ETH", "USDT", "XRP", "BNB", "USDC", "OTHER"]
const CURRENCY_TYPE_VALUES = ["BOB", "USD", "BTC", "ETH", "USDT", "XRP", "BNB", "USDC", "OTHER"] as const

// Schema base sin refinement — permite llamar .partial()
const transactionBaseSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  account_id: z.string().min(1, "Selecciona una cuenta"),
  to_account_id: z.string().optional(),
  category_id: z.string().optional(),
  date: z.string().min(1, "Selecciona una fecha"),
  description: z.string().optional(),
  payment_method: z.enum(PAYMENT_METHODS).optional(),
  is_recurring: z.boolean().default(false),
  currency: z.string().optional(),
})
// Schema de creación — agrega el refinement de cuenta destino
export const createTransactionSchema = transactionBaseSchema.refine((data) => {
  if (data.type === "TRANSFER" || data.type === "SAVING") {
    return !!data.to_account_id && data.to_account_id !== data.account_id
  }
  return true
}, {
  message: "Selecciona una cuenta destino diferente a la origen",
  path: ["to_account_id"],
})

// Schema de actualización — permite campos opcionales
export const updateTransactionSchema = transactionBaseSchema.partial()

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
