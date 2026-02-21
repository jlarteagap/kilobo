// lib/validations/category.schema.ts
import { z } from 'zod'

const CATEGORY_TYPE_VALUES = ['INCOME', 'EXPENSE'] as const

// ─── Schemas base reutilizables ───────────────────────────────────────────────
const nameSchema  = z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50)
const iconSchema  = z.string().nullable().optional()
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').nullable().optional()
const tagsSchema  = z.array(z.string().min(1).max(20)).max(10).optional()

// ─── Create ───────────────────────────────────────────────────────────────────
export const createCategorySchema = z.object({
  name:      nameSchema,
  type:      z.enum(CATEGORY_TYPE_VALUES, { message: 'Tipo de categoría inválido' }),
  icon:      iconSchema,
  color:     colorSchema,
  tags:      tagsSchema,
  parent_id: z.string().nullable().optional(),
})

// ─── Update — solo campos editables, sin type ni parent_id ───────────────────
export const updateCategorySchema = z.object({
  name:  nameSchema.optional(),
  icon:  iconSchema,
  color: colorSchema,
  tags:  tagsSchema,
})

// ─── Types inferidos ──────────────────────────────────────────────────────────
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>