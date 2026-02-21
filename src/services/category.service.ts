// services/category.service.ts
import { categoriesRepository } from '@/repositories/categories.repository'
import { CreateCategoryDTO, UpdateCategoryDTO, Category } from '@/types/category'

export const categoryService = {

  // ─── Read ──────────────────────────────────────────────────────────────────
  async getCategories(): Promise<Category[]> {
    return categoriesRepository.findAll()
  },

  async getCategoryById(categoryId: string): Promise<Category> {
    const category = await categoriesRepository.findById(categoryId)
    if (!category) throw new Error('Categoría no encontrada.')
    return category
  },

  // ─── Create ────────────────────────────────────────────────────────────────
  async createCategory(data: CreateCategoryDTO): Promise<Category> {
    return categoriesRepository.create(data)
  },

  // ─── Update ────────────────────────────────────────────────────────────────
  async updateCategory(categoryId: string, data: UpdateCategoryDTO): Promise<Category> {
    const category = await categoriesRepository.findById(categoryId)
    if (!category) throw new Error('Categoría no encontrada.')

    // Si se están eliminando tags, verificar que ninguno esté en uso
    if (data.tags !== undefined) {
      const currentTags = category.tags ?? []
      const removedTags = currentTags.filter((t) => !data.tags!.includes(t))

      for (const tag of removedTags) {
        const inUse = await categoriesRepository.isTagUsedInTransactions(categoryId, tag)
        if (inUse) {
          throw new Error(`El tag "${tag}" está en uso en transacciones y no puede eliminarse.`)
        }
      }
    }

    return categoriesRepository.update(categoryId, data)
  },

  // ─── Delete ────────────────────────────────────────────────────────────────
  async deleteCategory(categoryId: string): Promise<void> {
    const category = await categoriesRepository.findById(categoryId)
    if (!category) throw new Error('Categoría no encontrada.')

    // Proteger si la categoría tiene transacciones asociadas
    const inUse = await categoriesRepository.isUsedInTransactions(categoryId)
    if (inUse) {
      throw new Error('No se puede eliminar una categoría que tiene transacciones asociadas.')
    }

    return categoriesRepository.delete(categoryId)
  },
}