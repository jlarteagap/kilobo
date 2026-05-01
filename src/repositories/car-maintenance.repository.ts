import { adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

export type MaintenanceType = 'oil' | 'injectors' | 'wash'

export interface CarMaintenanceLog {
  id: string
  type: MaintenanceType
  cost: number
  odometer: number
  date: number
  notes?: string
}

export interface CarConfig {
  absoluteOdometer: number
}

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
  async addMaintenanceLog(data: Omit<CarMaintenanceLog, 'id' | 'date'>): Promise<void> {
    await LOGS_COLLECTION.add({
      ...data,
      date: Date.now()
    })
  },

  async getMaintenanceLogs(type?: MaintenanceType): Promise<CarMaintenanceLog[]> {
    let query: FirebaseFirestore.Query = LOGS_COLLECTION
    if (type) {
      query = query.where('type', '==', type)
    }
    
    const snapshot = await query.orderBy('date', 'desc').get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CarMaintenanceLog))
  },

  async deleteMaintenanceLog(id: string): Promise<void> {
    await LOGS_COLLECTION.doc(id).delete()
  }
}
