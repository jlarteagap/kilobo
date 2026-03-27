// repositories/project.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import type { Project, CreateProjectData, UpdateProjectData } from '@/types/project'

const col = adminDb.collection('projects')

function toISOString(value: unknown): string {
  if (!value) return new Date().toISOString()
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'object' && value !== null && '_seconds' in value)
    return new Date((value as any)._seconds * 1000).toISOString()
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  return new Date().toISOString()
}

function mapProject(id: string, data: FirebaseFirestore.DocumentData): Project {
  return {
    ...data,
    id,
    created_at: toISOString(data.created_at),
    updated_at: toISOString(data.updated_at),
  } as Project
}

export const projectRepository = {
  async findAll(userId: string): Promise<Project[]> {
    const snap = await col
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get()
    const projects = snap.docs.map((d) => mapProject(d.id, d.data()))
    return projects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  async findById(id: string, userId: string): Promise<Project | null> {
    const doc = await col.doc(id).get()
    if (!doc.exists) return null
    const data = doc.data()!
    if (data.user_id !== userId) return null
    return mapProject(doc.id, data)
  },

  async create(data: CreateProjectData, userId: string): Promise<Project> {
    const now = FieldValue.serverTimestamp()
    const ref = col.doc()
    await ref.set({ ...data, user_id: userId, status: 'active', created_at: now, updated_at: now })
    const created = await ref.get()
    return mapProject(ref.id, created.data()!)
  },

  async update(id: string, data: UpdateProjectData, userId: string): Promise<Project> {
    const ref = col.doc(id)
    await ref.update({ ...data, updated_at: FieldValue.serverTimestamp() })
    const updated = await ref.get()
    return mapProject(ref.id, updated.data()!)
  },

  async delete(id: string): Promise<void> {
    await col.doc(id).delete()
  },
}