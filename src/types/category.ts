export interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  parent_id: string | null
  icon: string | null
}

export interface CreateCategoryData {
  name: string
  type: 'INCOME' | 'EXPENSE'
  parent_id?: string | null
  icon?: string | null
}
