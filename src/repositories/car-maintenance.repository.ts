import { adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'
import type { CarMaintenanceLog, MaintenanceType } from '@/types/car-maintenance'

const CONFIG_COLLECTION = adminDb.collection('car_config')
const LOGS_COLLECTION = adminDb.collection('car_maintenance_logs')

export const carMaintenanceRepository = {
  // --- Odometer Management ---
  async getAbsoluteOdometer(): Promise<number | null> {
    const doc = await CONFIG_COLLECTION.doc('main_config').get()
    if (!doc.exists) return null
    return doc.data()?.absoluteOdometer || null
  },

  async setAbsoluteOdometer(value: number): Promise<void> {
    await CONFIG_COLLECTION.doc('main_config').set({ absoluteOdometer: value }, { merge: true })
  },

  async incrementAbsoluteOdometer(amount: number): Promise<void> {
    if (amount === 0) return
    const doc = await CONFIG_COLLECTION.doc('main_config').get()
    if (doc.exists) {
      await CONFIG_COLLECTION.doc('main_config').update({
        absoluteOdometer: FieldValue.increment(amount)
      })
    }
  },

  // --- Maintenance Logs Management ---
  async addMaintenanceLog(
    data: Omit<CarMaintenanceLog, 'id' | 'date'>
  ): Promise<string> {
    const docRef = await LOGS_COLLECTION.add({
      ...data,
      date: Date.now(),
    })
    return docRef.id
  },

  async getMaintenanceLogs(type?: MaintenanceType): Promise<CarMaintenanceLog[]> {
    let query: FirebaseFirestore.Query = LOGS_COLLECTION
    if (type) {
      query = query.where('type', '==', type)
    }
    
    const snapshot = await query.orderBy('date', 'desc').get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CarMaintenanceLog))
  },

  async findById(id: string): Promise<CarMaintenanceLog | null> {
    const doc = await LOGS_COLLECTION.doc(id).get()
    if (!doc.exists) return null
    return { id: doc.id, ...doc.data() } as CarMaintenanceLog
  },

  async deleteMaintenanceLog(id: string): Promise<void> {
    await LOGS_COLLECTION.doc(id).delete()
  }
}
