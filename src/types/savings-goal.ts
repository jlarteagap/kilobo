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
  '#4F6A35', '#4A6FA5', '#8B7EA8', '#C08A2E', '#B5543D',
  '#7A9B57', '#ACC18A', '#D9A487', '#5F7D42', '#837A75',
]
