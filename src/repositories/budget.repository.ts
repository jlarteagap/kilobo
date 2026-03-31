// repositories/budget.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { Budget, CreateBudgetData, UpdateBudgetData } from '@/types/budget'

const budgetsCollection = adminDb.collection('budgets')

interface SerializedTimestamp { _seconds: number; _nanoseconds: number }

function isSerializedTimestamp(val: unknown): val is SerializedTimestamp {
  return (
    typeof val === 'object' &&
    val !== null &&
    '_seconds' in val &&
    typeof (val as SerializedTimestamp)._seconds === 'number'
  )
}

function toISOString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (isSerializedTimestamp(value)) {
    return new Date(value._seconds * 1000).toISOString()
  }
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

function mapBudget(id: string, data: FirebaseFirestore.DocumentData): Budget {
  return {
    ...data,
    id,
    category_ids: data.category_ids ?? [],
    is_active:    data.is_active    ?? true,
    due_day:      data.due_day      ?? null,
    created_at:   toISOString(data.created_at),
    updated_at:   toISOString(data.updated_at),
  } as Budget
}

export const budgetRepository = {
  // ── Obtener todos ─────────────────────────────────────────────────────────
  async findAll(): Promise<Budget[]> {
    const snapshot = await budgetsCollection
      .orderBy('created_at', 'desc')
      .get()
    return snapshot.docs.map((doc) => mapBudget(doc.id, doc.data()))
  },

  // ── Obtener solo activos ──────────────────────────────────────────────────
  async findActive(): Promise<Budget[]> {
    const snapshot = await budgetsCollection
      .where('is_active', '==', true)
      .orderBy('created_at', 'desc')
      .get()
    return snapshot.docs.map((doc) => mapBudget(doc.id, doc.data()))
  },

  // ── Obtener por id ────────────────────────────────────────────────────────
  async findById(id: string): Promise<Budget | null> {
    const doc = await budgetsCollection.doc(id).get()
    if (!doc.exists) return null
    return mapBudget(doc.id, doc.data()!)
  },

  // ── Crear ─────────────────────────────────────────────────────────────────
  async create(data: CreateBudgetData): Promise<Budget> {
    const payload = {
      ...data,
      user_id:    '',
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    }
    const docRef  = await budgetsCollection.add(payload)
    const created = await docRef.get()
    return mapBudget(docRef.id, created.data()!)
  },

  // ── Actualizar ────────────────────────────────────────────────────────────
  async update(id: string, data: UpdateBudgetData): Promise<Budget> {
    const docRef = budgetsCollection.doc(id)
    await docRef.update({
      ...data,
      updated_at: Timestamp.now(),
    })
    const updated = await docRef.get()
    return mapBudget(docRef.id, updated.data()!)
  },

  // ── Archivar (soft delete) ────────────────────────────────────────────────
  async archive(id: string): Promise<Budget> {
    const docRef = budgetsCollection.doc(id)
    await docRef.update({
      is_active:  false,
      updated_at: Timestamp.now(),
    })
    const updated = await docRef.get()
    return mapBudget(docRef.id, updated.data()!)
  },

  // ── Eliminar (hard delete) ────────────────────────────────────────────────
  async delete(id: string): Promise<void> {
    await budgetsCollection.doc(id).delete()
  },
}