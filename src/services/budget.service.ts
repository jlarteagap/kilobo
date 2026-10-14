// services/budget.service.ts
import { budgetRepository } from '@/repositories/budget.repository'
import type { Budget, CreateBudgetData, UpdateBudgetData } from '@/types/budget'
import { invalidateDashboardCache } from '@/services/dashboard.service'

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

    const budget = await budgetRepository.create(data, userId)
    await invalidateDashboardCache(userId)
    return budget
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

    const updated = await budgetRepository.update(id, data)
    await invalidateDashboardCache(userId)
    return updated
  },

  // ── Archivar ──────────────────────────────────────────────────────────────
  async archiveBudget(id: string, userId: string) {
    const budget = await budgetRepository.findById(id, userId)
    if (!budget) throw new Error('Presupuesto no encontrado.')
    if (!budget.is_active) throw new Error('El presupuesto ya está archivado.')
    const archived = await budgetRepository.archive(id)
    await invalidateDashboardCache(userId)
    return archived
  },

  // ── Eliminar ──────────────────────────────────────────────────────────────
  async deleteBudget(id: string, userId: string) {
    const budget = await budgetRepository.findById(id, userId)
    if (!budget) throw new Error('Presupuesto no encontrado.')

    // Solo se puede eliminar si está archivado
    if (budget.is_active) {
      throw new Error('Archiva el presupuesto antes de eliminarlo.')
    }

    await budgetRepository.delete(id)
    await invalidateDashboardCache(userId)
  },
}