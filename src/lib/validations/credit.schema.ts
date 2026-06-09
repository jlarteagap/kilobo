import { z } from "zod"

const creditTypeSchema = z.enum(['BANK', 'VEHICLE', 'CREDIT_CARD', 'MORTGAGE', 'CONSUMER'])
const currencySchema   = z.enum(['BOB', 'USD', 'BTC', 'ETH', 'USDT', 'XRP', 'BNB', 'USDC', 'OTHER'])

export const createCreditSchema = z
  .object({
    type:                 creditTypeSchema,
    institution:          z.string().min(1, 'La institución es requerida'),
    original_amount:      z.coerce.number().positive('El monto debe ser mayor a 0'),
    disbursed_amount:     z.coerce.number().positive('El monto desembolsado debe ser mayor a 0').optional(),
    currency:             currencySchema,
    annual_interest_rate: z.coerce.number().positive('La tasa debe ser mayor a 0').max(100, 'La tasa no puede superar 100%'),
    total_installments:   z.coerce.number().int().min(0).optional().default(0),
    paid_installments:    z.coerce.number().int().min(0, 'No puede ser negativo').optional(),
    current_balance:      z.coerce.number().min(0, 'El saldo no puede ser negativo').optional(),
    monthly_payment:      z.coerce.number().positive('El pago mensual debe ser mayor a 0').optional(),
    start_date:           z.string().min(1, 'La fecha de inicio es requerida'),
    first_payment_date:   z.string().min(1, 'La fecha del primer pago es requerida'),
    account_id:           z.string().optional(),
    disburse_recorded:    z.boolean().optional().default(true),
    notes:                z.string().nullable().optional(),
    has_history:          z.boolean().optional().default(false),
  })

export const payInstallmentsSchema = z.object({
  installment_ids: z.array(z.string()).min(1, 'Selecciona al menos una cuota'),
  amount:          z.coerce.number().positive('El monto debe ser mayor a 0'),
  account_id:      z.string().min(1, 'Selecciona una cuenta'),
})

export type CreateCreditInput = z.infer<typeof createCreditSchema>
export type PayInstallmentsInput = z.infer<typeof payInstallmentsSchema>
