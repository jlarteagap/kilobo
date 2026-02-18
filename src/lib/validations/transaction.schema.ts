import { z } from "zod"

const TRANSACTION_TYPE_VALUES = ["INCOME", "EXPENSE", "TRANSFER", "SAVING", "DEBT"] as const
const PAYMENT_METHOD_VALUES = ["CASH", "QR", "CARD", "TRANSFER", "OTHER"] as const
// Reusing currency values from account schema or defining here. 
// Assuming independent definition for now or I could import from account.schema if exported.
// But to avoid circular deps or tight coupling locally, I'll redefine or just use string for now if not strict?
// The user's account schema had: ["BOB", "USD", "BTC", "ETH", "USDT", "XRP", "BNB", "USDC", "OTHER"]
const CURRENCY_TYPE_VALUES = ["BOB", "USD", "BTC", "ETH", "USDT", "XRP", "BNB", "USDC", "OTHER"] as const

export const createTransactionSchema = z.object({
  account_id: z.string().min(1, "La cuenta es requerida"),
  to_account_id: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  type: z.enum(TRANSACTION_TYPE_VALUES, { message: "Tipo de transacción inválido" }),
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  date: z.string().datetime().or(z.string()), // Accept ISO string
  description: z.string().nullable().optional(),
  payment_method: z.enum(PAYMENT_METHOD_VALUES).nullable().optional(),
  is_recurring: z.boolean().default(false).optional(),
  currency: z.enum(CURRENCY_TYPE_VALUES).default("BOB").optional(),
})

export const updateTransactionSchema = createTransactionSchema.partial()

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
