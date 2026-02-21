// types/category.ts

export interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  icon?:      string | null
  color?:     string | null
  tags?:      string[]
  parent_id?: string | null
  _migrated?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateCategoryDTO {
  name: string
  type: 'INCOME' | 'EXPENSE'
  icon?:      string | null
  color?:     string | null
  tags?:      string[]
  parent_id?: string | null
}

export interface UpdateCategoryDTO {
  name?:  string
  icon?:  string | null
  color?: string | null
  tags?:  string[]
}

export interface CategoryApiResponse {
  data: Category[]
}

export interface CreateCategoryApiResponse {
  data: Category
}