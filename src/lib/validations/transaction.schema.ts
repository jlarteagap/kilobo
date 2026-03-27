// lib/validations/transaction.schema.ts
import { z } from 'zod'

export const TRANSACTION_TYPES    = ['INCOME', 'EXPENSE', 'TRANSFER', 'SAVING'] as const
export const CURRENCY_TYPE_VALUES = ['BOB', 'USD', 'BTC', 'ETH', 'USDT', 'XRP', 'BNB', 'USDC', 'OTHER'] as const

const transactionBaseSchema = z.object({
  type:                z.enum(TRANSACTION_TYPES),
  amount:              z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  account_id:          z.string().min(1, 'Selecciona una cuenta'),
  to_account_id:       z.string().optional(),
  category_id:         z.string().optional(),
  tag:                 z.string().optional(),   // ← nuevo
  date:                z.string().min(1, 'Selecciona una fecha'),
  description:         z.string().optional(),
  is_recurring:        z.boolean().default(false),
  currency:            z.string().optional(),
  project_id:          z.string().nullable().optional(),
  subtype:             z.string().max(40).nullable().optional(),
})

export const createTransactionSchema = transactionBaseSchema.refine((data) => {
  if (data.type === 'TRANSFER' || data.type === 'SAVING') {
    return !!data.to_account_id && data.to_account_id !== data.account_id
  }
  return true
}, {
  message: 'Selecciona una cuenta destino diferente a la origen',
  path: ['to_account_id'],
})

export const updateTransactionSchema = transactionBaseSchema.partial()

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>