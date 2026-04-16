// src/repositories/car-sharing.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

export interface CarTrip {
  id: string
  userName: string
  initialKm: number
  finalKm: number
  totalKm: number
  createdAt: string
}

export interface CarSharingConfig {
  gasAmount: number
}

// We use a single document for simplicity since it doesn't require auth
const CACHE_DOC = 'car_sharing/current_period'
const TRIPS_COLLECTION = adminDb.collection('car_sharing_trips')

export const carSharingRepository = {
  async getTrips(): Promise<CarTrip[]> {
    const snapshot = await TRIPS_COLLECTION.orderBy('createdAt', 'asc').get()

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        userName: data.userName,
        initialKm: data.initialKm,
        finalKm: data.finalKm,
        totalKm: data.totalKm,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
      }
    })
  },

  async addTrip(data: { userName: string, initialKm: number, finalKm: number }): Promise<CarTrip> {
    let totalKm = 0
    if (data.finalKm >= data.initialKm) {
      totalKm = data.finalKm - data.initialKm
    } else {
      // Odometer reset handling (e.g. 920 to 024)
      totalKm = 1000 + data.finalKm - data.initialKm
    }

    const payload = {
      userName: data.userName,
      initialKm: data.initialKm,
      finalKm: data.finalKm,
      totalKm,
      createdAt: FieldValue.serverTimestamp(),
    }

    const docRef = await TRIPS_COLLECTION.add(payload)
    const created = await docRef.get()
    const createdData = created.data()

    return {
      id: docRef.id,
      userName: createdData!.userName,
      initialKm: createdData!.initialKm,
      finalKm: createdData!.finalKm,
      totalKm: createdData!.totalKm,
      createdAt: new Date().toISOString() // Fallback
    }
  },

  async deleteTrip(tripId: string): Promise<void> {
    await TRIPS_COLLECTION.doc(tripId).delete()
  },

  async getConfig(): Promise<CarSharingConfig> {
    const doc = await adminDb.doc(CACHE_DOC).get()
    if (!doc.exists) {
      return { gasAmount: 0 }
    }
    return doc.data() as CarSharingConfig
  },

  async updateGasAmount(gasAmount: number): Promise<void> {
    await adminDb.doc(CACHE_DOC).set({ gasAmount }, { merge: true })
  },

  async resetPeriod(): Promise<void> {
    // Delete all trips
    const snapshot = await TRIPS_COLLECTION.get()
    const batch = adminDb.batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    // Reset Gas Amount to 0
    batch.set(adminDb.doc(CACHE_DOC), { gasAmount: 0 }, { merge: true })

    await batch.commit()
  }
}
