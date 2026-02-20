export interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  icon?: string
  color?: string
  tags?: string[]
  parent_id?: string
  createdAt: string
  updatedAt: string
}

// ─── DTOs ────────────────────────────────────────────────────────────────────
export interface CreateCategoryDTO {
  name: string
  type: 'INCOME' | 'EXPENSE'
  icon?: string
  color?: string
  tags?: string[]
  parent_id?: string
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {}

// ─── Respuestas de API ───────────────────────────────────────────────────────
export interface CategoryApiResponse {
  data: Category[]
}

export interface CreateCategoryApiResponse {
  data: Category
}