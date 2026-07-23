import { z } from "zod"

export const createInvestmentSchema = z.object({
  account_id: z.string().min(1, "Selecciona una cuenta"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  units: z.coerce.number().positive("Las unidades deben ser mayores a 0").nullable().optional(),
  unit_price: z.coerce.number().positive("El precio debe ser mayor a 0").nullable().optional(),
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
  units: z.coerce.number().positive("Las unidades deben ser mayores a 0"),
  unit_price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  currency: z.string().min(1, "Moneda requerida"),
  date: z.string().min(1, "Selecciona una fecha"),
  notes: z.string().nullable().optional(),
})

export const sellInvestmentSchema = z.object({
  investment_id: z.string().min(1, "Inversión requerida"),
  account_id: z.string().min(1, "Cuenta requerida"),
  units: z.coerce.number().positive("Las unidades deben ser mayores a 0"),
  unit_price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  currency: z.string().min(1, "Moneda requerida"),
  date: z.string().min(1, "Selecciona una fecha"),
  notes: z.string().nullable().optional(),
})

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>
export type BuyInvestmentInput = z.infer<typeof buyInvestmentSchema>
export type SellInvestmentInput = z.infer<typeof sellInvestmentSchema>
