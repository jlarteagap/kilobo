// lib/validations/debt.schema.ts
import { z } from 'zod'

export const DEBT_TYPES   = ['GIVEN', 'RECEIVED'] as const
export const DEBT_STATUSES = ['ACTIVE', 'PAID', 'CANCELLED'] as const

export const createDebtSchema = z.object({
  type:         z.enum(DEBT_TYPES),
  contact_name: z.string().min(1, 'El nombre es requerido'),
  amount:       z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  currency:     z.string().min(1, 'Selecciona una moneda'),
  account_id:   z.string().min(1, 'Selecciona una cuenta'),
  description:  z.string().optional(),
})

export const createDebtPaymentSchema = z.object({
  amount:     z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  account_id: z.string().min(1, 'Selecciona una cuenta'),
  notes:      z.string().optional(),
  date:       z.string().min(1, 'Selecciona una fecha'),
})

export type CreateDebtInput        = z.infer<typeof createDebtSchema>
export type CreateDebtPaymentInput = z.infer<typeof createDebtPaymentSchema>