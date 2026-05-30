import { savingsGoalRepository } from '@/repositories/savings-goal.repository'
import type { SavingsGoal, CreateSavingsGoalData, UpdateSavingsGoalData } from '@/types/savings-goal'

const MAX_ACTIVE_GOALS = 20

export const savingsGoalService = {
  async getGoals(userId: string): Promise<SavingsGoal[]> {
    return savingsGoalRepository.findAll(userId)
  },

  async getGoal(id: string, userId: string): Promise<SavingsGoal | null> {
    return savingsGoalRepository.findById(id, userId)
  },

  async createGoal(data: CreateSavingsGoalData, userId: string): Promise<SavingsGoal> {
    const existing = await savingsGoalRepository.findAll(userId)
    const activeCount = existing.filter(g => g.is_active).length

    if (activeCount >= MAX_ACTIVE_GOALS) {
      throw new Error(`No puedes tener más de ${MAX_ACTIVE_GOALS} metas activas. Archiva una para crear otra.`)
    }

    return savingsGoalRepository.create(data, userId)
  },

  async updateGoal(id: string, data: UpdateSavingsGoalData, userId: string): Promise<SavingsGoal> {
    const goal = await savingsGoalRepository.findById(id, userId)
    if (!goal) throw new Error('Meta no encontrada o no autorizada.')

    if (data.current_amount !== undefined && data.current_amount > goal.target_amount) {
      throw new Error('El monto actual no puede superar la meta.')
    }

    return savingsGoalRepository.update(id, data)
  },

  async deleteGoal(id: string, userId: string): Promise<void> {
    const goal = await savingsGoalRepository.findById(id, userId)
    if (!goal) throw new Error('Meta no encontrada o no autorizada.')

    return savingsGoalRepository.delete(id)
  },
}
