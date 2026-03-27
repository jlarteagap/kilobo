// lib/validations/project.schema.ts
import { z } from 'zod'

export const createProjectSchema = z.object({
  name:        z.string().min(1, 'El nombre es obligatorio').max(50),
  description: z.string().max(200).nullable().optional(),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
  icon:        z.string().max(4).nullable().optional(),
  subtypes:    z.array(z.string().min(1).max(40)).max(20).default([]),
})

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(['active', 'archived']).optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>