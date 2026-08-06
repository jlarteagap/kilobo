// src/repositories/driver-config.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { DriverConfig, DEFAULT_SUBTYPE_MAPPING } from '@/types/driver'

const configCollection = adminDb.collection('driver_config')

export const driverConfigRepository = {
  async findByUserId(userId: string): Promise<DriverConfig | null> {
    const doc = await configCollection.doc(userId).get()
    if (!doc.exists) return null
    return doc.data() as DriverConfig
  },

  async upsert(userId: string, data: DriverConfig): Promise<void> {
    await configCollection.doc(userId).set(data, { merge: true })
  },

  getDefaults(): Pick<DriverConfig, 'subtypeMapping'> {
    return { subtypeMapping: { ...DEFAULT_SUBTYPE_MAPPING } }
  },
}
