import { categoriesRepository } from '@/repositories/categories.repository'
import { CreateCategoryDTO } from '@/types/category'
import { Category } from '@/types/category'

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    return categoriesRepository.findAll()
  },

  async createCategory(data: CreateCategoryDTO): Promise<Category> {
    return categoriesRepository.create(data)
  },

  async updateCategory(
    categoryId: string,
    data: Partial<CreateCategoryDTO>
  ): Promise<Category> {
    const category = await categoriesRepository.findById(categoryId)
    if (!category) {
      throw new Error('Categoría no encontrada.')
    }

    return categoriesRepository.update(categoryId, data)
  },

  async deleteCategory(categoryId: string): Promise<void> {
    const category = await categoriesRepository.findById(categoryId)
    if (!category) {
      throw new Error('Categoría no encontrada.')
    }

    return categoriesRepository.delete(categoryId)
  },
}