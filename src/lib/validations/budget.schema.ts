// lib/validations/budget.schema.ts
import { z } from 'zod'
import { BUDGET_TYPES, type BudgetType } from '@/types/budget'

const BUDGET_TYPE_VALUES = BUDGET_TYPES.map((t) => t.value) as [BudgetType, ...BudgetType[]]

export const createBudgetSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'Máximo 50 caracteres'),

  type: z.enum(
    BUDGET_TYPE_VALUES,
    { message: 'Selecciona un tipo válido' }
  ),

  target_amount: z.coerce
    .number()
    .min(0.01, 'El monto debe ser mayor a 0'),

  currency: z
    .string()
    .min(1, 'Selecciona una moneda'),

  due_day: z.coerce
    .number()
    .int('Debe ser un número entero')
    .min(1,  'Mínimo día 1')
    .max(31, 'Máximo día 31')
    .nullable()
    .optional(),

  category_ids: z
    .array(z.string())
    .min(1, 'Selecciona al menos una categoría'),

  is_active: z.boolean().default(true),
})

// Refinement — due_day requerido si es FIXED_EXPENSE
export const createBudgetSchemaWithRefinement = createBudgetSchema.superRefine(
  (data, ctx) => {
    if (data.type === 'FIXED_EXPENSE' && !data.due_day) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ['due_day'],
        message: 'Los gastos fijos requieren un día de vencimiento',
      })
    }
  }
)

export const updateBudgetSchema = createBudgetSchema.partial()

export type CreateBudgetInput = z.infer<typeof createBudgetSchemaWithRefinement>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>