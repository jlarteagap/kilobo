import { adminDb } from '@/lib/firebase.admin'
import { Category, CreateCategoryData } from '@/types/category'
import { FieldValue } from 'firebase-admin/firestore'

const categoriesCollection = adminDb.collection('category')

export const categoriesRepository = {
  async findAll(): Promise<Category[]> {
    const snapshot = await categoriesCollection
      .get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Category, 'id'>),
    }))
  },

  async findById(categoryId: string): Promise<Category | null> {
    const doc = await categoriesCollection.doc(categoryId).get()
    if (!doc.exists) return null

    return { id: doc.id, ...(doc.data() as Omit<Category, 'id'>) }
  },

  async create(data: CreateCategoryData): Promise<Category> {
    const payload = {
      ...data,
      // Ensure optional fields are handled if undefined
      parent_id: data.parent_id ?? null,
      icon: data.icon ?? null,
    }

    const docRef = await categoriesCollection.add(payload)
    const created = await docRef.get()

    return { id: docRef.id, ...(created.data() as Omit<Category, 'id'>) }
  },

  async update(categoryId: string, data: Partial<CreateCategoryData>): Promise<Category> {
    const docRef = categoriesCollection.doc(categoryId)

    await docRef.update({
      ...data,
    })

    const updated = await docRef.get()
    return { id: docRef.id, ...(updated.data() as Omit<Category, 'id'>) }
  },

  async delete(categoryId: string): Promise<void> {
    await categoriesCollection.doc(categoryId).delete()
  },
}
