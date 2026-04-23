// src/repositories/car-sharing.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

export interface CarTrip {
  userName: string
  initialKm: number
  finalKm: number
  totalKm: number
  date: string
  createdAt: number
}

export interface DebtResult {
  name: string
  totalKm: number
  percentage: number
  cost: number
}

export interface CarCycle {
  id: string
  status: 'active' | 'closed'
  startDate: number
  endDate: number | null
  gasAmount: number
  paidBy: string | null
  trips: CarTrip[]
  debtSummary: DebtResult[]
}

const CYCLES_COLLECTION = adminDb.collection('car_sharing_cycles')

export const carSharingRepository = {
  async getActiveCycle(): Promise<CarCycle> {
    const snapshot = await CYCLES_COLLECTION
      .where('status', '==', 'active')
      .limit(1)
      .get()

    if (snapshot.empty) {
      // Create a new active cycle
      const newCycle = {
        status: 'active',
        startDate: Date.now(),
        endDate: null,
        gasAmount: 0,
        paidBy: null,
        trips: [],
        debtSummary: []
      }
      const docRef = await CYCLES_COLLECTION.add(newCycle)
      return { id: docRef.id, ...newCycle } as CarCycle
    }

    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() } as CarCycle
  },

  async getClosedCycles(): Promise<CarCycle[]> {
    const snapshot = await CYCLES_COLLECTION
      .where('status', '==', 'closed')
      .get()

    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as CarCycle))
      .sort((a, b) => (b.endDate || 0) - (a.endDate || 0))
  },

  async addTrip(data: { userName: string, initialKm: number, finalKm: number }): Promise<void> {
    const activeCycle = await this.getActiveCycle()
    
    let totalKm = 0
    if (data.finalKm >= data.initialKm) {
      totalKm = data.finalKm - data.initialKm
    } else {
      totalKm = 1000 + data.finalKm - data.initialKm
    }

    const now = new Date()
    const trip: CarTrip = {
      userName: data.userName,
      initialKm: data.initialKm,
      finalKm: data.finalKm,
      totalKm,
      date: `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}`,
      createdAt: Date.now()
    }

    await CYCLES_COLLECTION.doc(activeCycle.id).update({
      trips: FieldValue.arrayUnion(trip)
    })
  },

  async deleteTrip(createdAt: number): Promise<void> {
    const activeCycle = await this.getActiveCycle()
    const updatedTrips = activeCycle.trips.filter(t => t.createdAt !== createdAt)
    
    await CYCLES_COLLECTION.doc(activeCycle.id).update({
      trips: updatedTrips
    })
  },

  async closeActiveCycle(gasAmount: number, paidBy: string): Promise<void> {
    const activeCycle = await this.getActiveCycle()
    
    // Calculate Summary
    const totalKmOverall = activeCycle.trips.reduce((acc, trip) => acc + trip.totalKm, 0)
    const map = new Map<string, number>()
    activeCycle.trips.forEach(trip => {
      map.set(trip.userName, (map.get(trip.userName) || 0) + trip.totalKm)
    })

    const debtSummary: DebtResult[] = Array.from(map.entries()).map(([name, totalKm]) => {
      const percentage = totalKmOverall > 0 ? (totalKm / totalKmOverall) : 0
      const cost = percentage * gasAmount
      return {
        name,
        totalKm,
        percentage: percentage * 100,
        cost
      }
    })

    // 1. Close current cycle
    const lastKm = activeCycle.trips.length > 0 
      ? activeCycle.trips[activeCycle.trips.length - 1].finalKm 
      : 0

    await CYCLES_COLLECTION.doc(activeCycle.id).update({
      status: 'closed',
      endDate: Date.now(),
      gasAmount,
      paidBy,
      debtSummary
    })

    // 2. Start new active cycle
    // Note: The next trip will automatically use the lastKm logic from UI if handled correctly,
    // or we can store lastKm in a config if needed. But for now, we just create the next cycle.
    await CYCLES_COLLECTION.add({
      status: 'active',
      startDate: Date.now(),
      endDate: null,
      gasAmount: 0,
      paidBy: null,
      trips: [],
      debtSummary: []
    })
  },

  async deleteCycle(id: string): Promise<void> {
    await CYCLES_COLLECTION.doc(id).delete()
  },

  async resetAll(): Promise<void> {
    const snapshot = await CYCLES_COLLECTION.get()
    const batch = adminDb.batch()
    snapshot.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
    
    // Ensure one active cycle exists
    await this.getActiveCycle()
  }
}
