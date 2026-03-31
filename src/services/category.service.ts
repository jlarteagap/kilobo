// services/category.service.ts
import { categoriesRepository } from '@/repositories/categories.repository'
import { CreateCategoryDTO, UpdateCategoryDTO, Category } from '@/types/category'

export const categoryService = {

  // ─── Read ──────────────────────────────────────────────────────────────────
  async getCategories(userId: string): Promise<Category[]> {
    return categoriesRepository.findAll(userId)
  },

  async getCategoryById(categoryId: string, userId: string): Promise<Category> {
    const category = await categoriesRepository.findById(categoryId, userId)
    if (!category) throw new Error('Categoría no encontrada o no autorizada.')
    return category
  },

  // ─── Create ────────────────────────────────────────────────────────────────
  async createCategory(data: CreateCategoryDTO, userId: string): Promise<Category> {
    return categoriesRepository.create(data, userId)
  },

  // ─── Update ────────────────────────────────────────────────────────────────
  async updateCategory(categoryId: string, data: UpdateCategoryDTO, userId: string): Promise<Category> {
    const category = await categoriesRepository.findById(categoryId, userId)
    if (!category) throw new Error('Categoría no encontrada o no autorizada.')

    // Si se están eliminando tags, verificar que ninguno esté en uso
    if (data.tags !== undefined) {
      const currentTags = category.tags ?? []
      const removedTags = currentTags.filter((t) => !data.tags!.includes(t))

      for (const tag of removedTags) {
        const inUse = await categoriesRepository.isTagUsedInTransactions(categoryId, tag, userId)
        if (inUse) {
          throw new Error(`El tag "${tag}" está en uso en transacciones y no puede eliminarse.`)
        }
      }
    }

    return categoriesRepository.update(categoryId, data)
  },

  // ─── Delete ────────────────────────────────────────────────────────────────
  async deleteCategory(categoryId: string, userId: string): Promise<void> {
    const category = await categoriesRepository.findById(categoryId, userId)
    if (!category) throw new Error('Categoría no encontrada o no autorizada.')

    // Proteger si la categoría tiene transacciones asociadas
    const inUse = await categoriesRepository.isUsedInTransactions(categoryId, userId)
    if (inUse) {
      throw new Error('No se puede eliminar una categoría que tiene transacciones asociadas.')
    }

    return categoriesRepository.delete(categoryId)
  },
}