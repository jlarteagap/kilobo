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

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>
