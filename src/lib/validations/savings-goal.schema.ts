import { z } from 'zod'

const CURRENCY_VALUES = ['BOB', 'USD', 'BTC', 'ETH', 'USDT', 'XRP', 'BNB', 'USDC', 'OTHER'] as const

export const createSavingsGoalSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(60, 'Máximo 60 caracteres'),
  target_amount: z.coerce.number().min(1, 'La meta debe ser mayor a 0'),
  currency: z.enum(CURRENCY_VALUES).default('BOB'),
  account_id: z.string().min(1, 'Selecciona una cuenta'),
  deadline: z.string().nullable().optional(),
  icon: z.string().default('🎯'),
  color: z.string().default('#10b981'),
  auto_save_percentage: z.coerce.number().min(0).max(100).default(0),
})

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial().extend({
  current_amount: z.coerce.number().min(0).optional(),
  is_active: z.boolean().optional(),
})

export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>
