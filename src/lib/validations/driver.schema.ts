import { z } from 'zod'
import { EXPENSE_TYPES, PAYMENT_METHODS } from '@/types/driver'

const appAmount = z.coerce.number().min(0, 'El valor no puede ser negativo')

const earningsPerApp = z.object({
  CASH: appAmount,
  CARD: appAmount,
  QR: appAmount,
})

// Schema para registrar un turno manualmente (crear o editar)
export const shiftSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  hoursWorked: z.coerce.number().min(0.25, 'Ingresa las horas trabajadas').max(24, 'Máximo 24 horas'),
  startKm: z.coerce.number().min(0, 'Km inválido').max(999, 'Máximo 999').nullable().optional(),
  endKm: z.coerce.number().min(0, 'Km inválido').max(999, 'Máximo 999').nullable().optional(),
  earnings: z.object({
    UBER: earningsPerApp,
    YANGO: earningsPerApp,
    INDRIVE: earningsPerApp,
  }),
  bonuses: z.object({
    UBER: appAmount,
    YANGO: appAmount,
    INDRIVE: appAmount,
  }),
  commissions: z.object({
    UBER: appAmount,
    YANGO: appAmount,
    INDRIVE: appAmount,
  }),
  expenses: z.array(z.object({
    type: z.enum(EXPENSE_TYPES),
    amount: appAmount,
    paymentMethod: z.enum(PAYMENT_METHODS),
  })).default([]),
  notes: z.string().max(500, 'Máximo 500 caracteres').nullable().optional(),
})

export type ShiftInputSchema = z.infer<typeof shiftSchema>

// Schema para configuración
export const driverConfigSchema = z.object({
  projectId: z.string().min(1, 'Selecciona una actividad'),
  incomeCashAccountId: z.string().min(1, 'Selecciona una cuenta para efectivo'),
  incomeQrAccountId: z.string().min(1, 'Selecciona una cuenta para QR'),
  expenseCashAccountId: z.string().min(1, 'Selecciona una cuenta para gastos en efectivo'),
  expenseQrAccountId: z.string().min(1, 'Selecciona una cuenta para gastos con QR'),
  commissionAccountId: z.string().min(1, 'Selecciona una cuenta para comisiones'),
  subtypeMapping: z.object({
    uber: z.string().min(1),
    yango: z.string().min(1),
    indrive: z.string().min(1),
    bonus: z.string().min(1),
    commission: z.string().min(1),
    toll: z.string().min(1),
    gas: z.string().min(1),
    maintenance: z.string().min(1),
    other: z.string().min(1),
  }),
})

export type DriverConfigInput = z.infer<typeof driverConfigSchema>

// Query por ciclo mensual: ?year=YYYY&month=MM (1-12), ambos opcionales pero deben ir juntos
export const monthQuerySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
}).refine(
  (v) => (v.year == null) === (v.month == null),
  { message: 'year y month deben ir juntos', path: ['month'] },
)

export type MonthQuery = z.infer<typeof monthQuerySchema>
