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

  category_ids: z.array(z.string()).default([]),  // ← ya no tiene .min(1)

  is_active:  z.boolean().default(true),
  project_id: z.string().nullable().optional(),
  subtypes:   z.array(z.string()).optional().default([]),
})

export const createBudgetSchemaWithRefinement = createBudgetSchema.superRefine(
  (data, ctx) => {
    // due_day requerido si es FIXED_EXPENSE
    if (data.type === 'FIXED_EXPENSE' && !data.due_day) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ['due_day'],
        message: 'Los gastos fijos requieren un día de vencimiento',
      })
    }

    // category_ids requerido solo si NO hay proyecto
    if (!data.project_id && (!data.category_ids || data.category_ids.length === 0)) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ['category_ids'],
        message: 'Selecciona al menos una categoría',
      })
    }

    // project_id requerido si estamos en modo proyecto (sin category_ids)
    if (data.category_ids.length === 0 && !data.project_id) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ['project_id'],
        message: 'Selecciona un proyecto',
      })
    }
  }
)

export const updateBudgetSchema = createBudgetSchema.partial()

export type CreateBudgetInput = z.infer<typeof createBudgetSchemaWithRefinement>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>