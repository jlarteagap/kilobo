// services/budget.service.ts
import { budgetRepository } from '@/repositories/budget.repository'
import type { Budget, CreateBudgetData, UpdateBudgetData } from '@/types/budget'

export const budgetService = {
  // ── Obtener todos ─────────────────────────────────────────────────────────
  async getBudgets(userId: string): Promise<Budget[]> {
    return budgetRepository.findAll(userId)
  },

  // ── Obtener solo activos ──────────────────────────────────────────────────
  async getActiveBudgets(userId: string) {
    return budgetRepository.findActive(userId)
  },

  // ── Crear ─────────────────────────────────────────────────────────────────
  async createBudget(data: CreateBudgetData, userId: string) {
    // En modo proyecto no se requieren categorías — son mutuamente excluyentes
    if (!data.project_id && !data.category_ids?.length) {
      throw new Error('Selecciona al menos una categoría.')
    }

    if (data.type === 'FIXED_EXPENSE' && !data.due_day) {
      throw new Error('Los gastos fijos requieren un día de vencimiento.')
    }

    return budgetRepository.create(data, userId)
  },

  // ── Actualizar ────────────────────────────────────────────────────────────
  async updateBudget(id: string, data: UpdateBudgetData, userId: string) {
    const budget = await budgetRepository.findById(id, userId)
    if (!budget) throw new Error('Presupuesto no encontrado.')

    // Si cambia a FIXED_EXPENSE, validar due_day
    const resolvedType    = data.type    ?? budget.type
    const resolvedDueDay  = data.due_day ?? budget.due_day

    if (resolvedType === 'FIXED_EXPENSE' && !resolvedDueDay) {
      throw new Error('Los gastos fijos requieren un día de vencimiento.')
    }

    return budgetRepository.update(id, data)
  },

  // ── Archivar ──────────────────────────────────────────────────────────────
  async archiveBudget(id: string, userId: string) {
    const budget = await budgetRepository.findById(id, userId)
    if (!budget) throw new Error('Presupuesto no encontrado.')
    if (!budget.is_active) throw new Error('El presupuesto ya está archivado.')
    return budgetRepository.archive(id)
  },

  // ── Eliminar ──────────────────────────────────────────────────────────────
  async deleteBudget(id: string, userId: string) {
    const budget = await budgetRepository.findById(id, userId)
    if (!budget) throw new Error('Presupuesto no encontrado.')

    // Solo se puede eliminar si está archivado
    if (budget.is_active) {
      throw new Error('Archiva el presupuesto antes de eliminarlo.')
    }

    return budgetRepository.delete(id)
  },
}