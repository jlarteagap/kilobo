import { z } from "zod"

export const createInvestmentSchema = z.object({
  account_id: z.string().min(1, "Selecciona una cuenta"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  currency: z.string().optional(),
  date: z.string().min(1, "Selecciona una fecha"),
  notes: z.string().nullable().optional(),
  transaction_id: z.string().nullable().optional(),
})

export const updateInvestmentSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0").optional(),
  currency: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().nullable().optional(),
})

export const buyInvestmentSchema = z.object({
  investment_id: z.string().min(1, "Inversión requerida"),
  account_id: z.string().min(1, "Cuenta requerida"),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  currency: z.string().min(1, "Moneda requerida"),
  date: z.string().min(1, "Selecciona una fecha"),
  notes: z.string().nullable().optional(),
})

export const sellInvestmentSchema = z.object({
  investment_id: z.string().min(1, "Inversión requerida"),
  account_id: z.string().min(1, "Cuenta requerida"),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  currency: z.string().min(1, "Moneda requerida"),
  date: z.string().min(1, "Selecciona una fecha"),
  notes: z.string().nullable().optional(),
})

export const recurringBuySchema = z.object({
  enabled: z.boolean(),
  day_of_week: z.coerce.number().int().min(0).max(6, "Día de la semana inválido"),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
})

export const executeRecurringBuySchema = z.object({
  date: z.string().optional(),
})

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>
export type BuyInvestmentInput = z.infer<typeof buyInvestmentSchema>
export type SellInvestmentInput = z.infer<typeof sellInvestmentSchema>
export type SaveRecurringInput = z.infer<typeof recurringBuySchema>
export type ExecuteRecurringBuyInput = z.infer<typeof executeRecurringBuySchema>
