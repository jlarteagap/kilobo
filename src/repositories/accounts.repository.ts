// src/repositories/accounts.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { Account, CreateAccountData, UpdateAccountData } from '@/types/account'
import { FieldValue } from 'firebase-admin/firestore'

const accountsCollection = adminDb.collection('accounts')

export const accountsRepository = {
  async findAll(): Promise<Account[]> {
    const snapshot = await accountsCollection
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Account, 'id'>),
    }))
  },

  async findById(accountId: string): Promise<Account | null> {
    const doc = await accountsCollection.doc(accountId).get()
    if (!doc.exists) return null

    return { id: doc.id, ...(doc.data() as Omit<Account, 'id'>) }
  },

  async create(data: CreateAccountData): Promise<Account> {
    const payload = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = await accountsCollection.add(payload)
    const created = await docRef.get()

    return { id: docRef.id, ...(created.data() as Omit<Account, 'id'>) }
  },

  async update(accountId: string, data: UpdateAccountData): Promise<Account> {
    const docRef = accountsCollection.doc(accountId)

    await docRef.update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    return { id: docRef.id, ...(updated.data() as Omit<Account, 'id'>) }
  },

  async delete(accountId: string): Promise<void> {
    await accountsCollection.doc(accountId).delete()
  },

  async isUsedInTransactions(accountId: string): Promise<boolean> {
  const snapshot = await adminDb.collection('transactions')
    .where('account_id', '==', accountId)
    .limit(1)
    .get()

  if (!snapshot.empty) return true

  // Verificar también como cuenta destino
  const snapshotDest = await adminDb.collection('transactions')
    .where('to_account_id', '==', accountId)
    .limit(1)
    .get()

  return !snapshotDest.empty
},
}