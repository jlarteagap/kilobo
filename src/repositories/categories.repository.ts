// repositories/categories.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '@/types/category'

const categoriesCol  = adminDb.collection('category')
const transactionsCol = adminDb.collection('transactions')

export const categoriesRepository = {

  // ─── Read ──────────────────────────────────────────────────────────────────
  async findAll(userId: string): Promise<Category[]> {
    const snapshot = await categoriesCol
      .where('user_id', '==', userId)
      .get()
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Category, 'id'>) }))
      .filter((c) => !c._migrated) // oculta subcategorías migradas
  },

  async findById(categoryId: string, userId: string): Promise<Category | null> {
    const doc = await categoriesCol.doc(categoryId).get()
    if (!doc.exists) return null

    const data = doc.data()!
    if (data.user_id !== userId) return null

    return { id: doc.id, ...(data as Omit<Category, 'id'>) }
  },

  // ─── Validación de uso ─────────────────────────────────────────────────────
  /**
   * Verifica si una categoría está siendo usada en alguna transacción.
   * Se usa antes de eliminar para evitar romper referencias.
   */
  async isUsedInTransactions(categoryId: string, userId: string): Promise<boolean> {
    const snapshot = await transactionsCol
      .where('category_id', '==', categoryId)
      .where('user_id', '==', userId)
      .limit(1)
      .get()
    return !snapshot.empty
  },

  /**
   * Verifica si un tag específico está siendo usado en transacciones
   * de una categoría. Se usa antes de eliminar un tag.
   */
  async isTagUsedInTransactions(categoryId: string, tag: string, userId: string): Promise<boolean> {
    const snapshot = await transactionsCol
      .where('category_id', '==', categoryId)
      .where('tag', '==', tag)
      .where('user_id', '==', userId)
      .limit(1)
      .get()
    return !snapshot.empty
  },

  // ─── Write ─────────────────────────────────────────────────────────────────
  async create(data: CreateCategoryDTO, userId: string): Promise<Category> {
    const payload = {
      ...data,
      parent_id: data.parent_id ?? null,
      icon:      data.icon ?? null,
      color:     data.color ?? null,
      tags:      data.tags ?? [],
      user_id:   userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const docRef  = await categoriesCol.add(payload)
    const created = await docRef.get()
    return { id: docRef.id, ...(created.data() as Omit<Category, 'id'>) }
  },

  async update(categoryId: string, data: UpdateCategoryDTO, userId: string): Promise<Category> {
    const docRef = categoriesCol.doc(categoryId)

    await docRef.update({
      ...data,
      updatedAt: new Date().toISOString(),
    })

    const updated = await docRef.get()
    return { id: docRef.id, ...(updated.data() as Omit<Category, 'id'>) }
  },

  async delete(categoryId: string, userId: string): Promise<void> {
    await categoriesCol.doc(categoryId).delete()
  },
}