export interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  parent_id: string | null
  icon: string | null
  user_id: string
}

export interface CreateCategoryData {
  name: string
  type: 'INCOME' | 'EXPENSE'
  parent_id?: string | null
  icon?: string | null
}
