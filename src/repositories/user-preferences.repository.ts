import { adminDb } from '@/lib/firebase.admin'
import { Timestamp } from 'firebase-admin/firestore'

export interface UserPreferences {
  displayCurrency: 'BOB' | 'USD'
}

const DEFAULT_PREFERENCES: UserPreferences = {
  displayCurrency: 'BOB',
}

function doc(userId: string) {
  return adminDb.collection('users').doc(userId)
}

export const userPreferencesRepository = {
  async get(userId: string): Promise<UserPreferences> {
    const snapshot = await doc(userId).get()
    const data = snapshot.exists ? snapshot.data() ?? {} : {}
    const preferences = data.preferences ?? {}
    return {
      displayCurrency: preferences.displayCurrency === 'USD' ? 'USD' : DEFAULT_PREFERENCES.displayCurrency,
    }
  },

  async update(userId: string, patch: Partial<UserPreferences>): Promise<UserPreferences> {
    await doc(userId).set(
      {
        preferences: {
          ...patch,
        },
        updated_at: Timestamp.now(),
      },
      { merge: true }
    )
    return this.get(userId)
  },

  async ensure(userId: string): Promise<void> {
    const snapshot = await doc(userId).get()
    if (!snapshot.exists) {
      await doc(userId).set({ preferences: DEFAULT_PREFERENCES })
    }
  },
}