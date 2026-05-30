export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  currency: string
  account_id: string
  deadline: string | null
  icon: string
  color: string
  auto_save_percentage: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export type CreateSavingsGoalData = Pick<SavingsGoal, 'name' | 'target_amount' | 'currency' | 'account_id' | 'deadline' | 'icon' | 'color' | 'auto_save_percentage'>

export type UpdateSavingsGoalData = Partial<Pick<SavingsGoal, 'name' | 'target_amount' | 'current_amount' | 'currency' | 'account_id' | 'deadline' | 'icon' | 'color' | 'auto_save_percentage' | 'is_active'>>

export const SAVINGS_GOAL_ICONS = [
  '✈️', '🏠', '🎓', '🚗', '💍', '👶', '🏥', '🎂',
  '🎄', '💻', '📱', '🎮', '👟', '🎸', '📚', '🌍',
  '🏖️', '🎪', '💎', '🍕',
]

export const SAVINGS_GOAL_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]
