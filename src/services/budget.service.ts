// services/budget.service.ts
import { budgetRepository } from '@/repositories/budget.repository'
import type { Budget, CreateBudgetData, UpdateBudgetData } from '@/types/budget'

export const budgetService = {
  // ── Obtener todos ─────────────────────────────────────────────────────────
  async getBudgets(): Promise<Budget[]> {
    return budgetRepository.findAll()
  },

  // ── Obtener solo activos ──────────────────────────────────────────────────
  async getActiveBudgets() {
    return budgetRepository.findActive()
  },

  // ── Crear ─────────────────────────────────────────────────────────────────
  async createBudget(data: CreateBudgetData) {
    // Validar que category_ids no esté vacío
    if (!data.category_ids?.length) {
      throw new Error('Selecciona al menos una categoría.')
    }

    // Validar due_day para FIXED_EXPENSE
    if (data.type === 'FIXED_EXPENSE' && !data.due_day) {
      throw new Error('Los gastos fijos requieren un día de vencimiento.')
    }

    return budgetRepository.create(data)
  },

  // ── Actualizar ────────────────────────────────────────────────────────────
  async updateBudget(id: string, data: UpdateBudgetData) {
    const budget = await budgetRepository.findById(id)
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
  async archiveBudget(id: string) {
    const budget = await budgetRepository.findById(id)
    if (!budget) throw new Error('Presupuesto no encontrado.')
    if (!budget.is_active) throw new Error('El presupuesto ya está archivado.')
    return budgetRepository.archive(id)
  },

  // ── Eliminar ──────────────────────────────────────────────────────────────
  async deleteBudget(id: string) {
    const budget = await budgetRepository.findById(id)
    if (!budget) throw new Error('Presupuesto no encontrado.')

    // Solo se puede eliminar si está archivado
    if (budget.is_active) {
      throw new Error('Archiva el presupuesto antes de eliminarlo.')
    }

    return budgetRepository.delete(id)
  },
}