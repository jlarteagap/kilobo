import { z } from "zod"

const CATEGORY_TYPE_VALUES = ["INCOME", "EXPENSE"] as const

export const createCategorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  type: z.enum(CATEGORY_TYPE_VALUES, { message: "Tipo de categoría inválido" }),
  parent_id: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
