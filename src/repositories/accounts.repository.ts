// src/repositories/accounts.repository.ts
import { adminDb } from '@/lib/firebase.admin'
import { Account, CreateAccountData, UpdateAccountData } from '@/types/account'
import { FieldValue } from 'firebase-admin/firestore'

const accountsCollection = adminDb.collection('accounts')

export const accountsRepository = {
  async findAll(userId: string): Promise<Account[]> {
    const snapshot = await accountsCollection
      .where('user_id', '==', userId)
      .get()

    const accounts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Account, 'id'>),
    }))

    return accounts.sort((a, b) => {
      const timeA = (a.createdAt as any)?.toMillis?.() || new Date(a.createdAt).getTime() || 0;
      const timeB = (b.createdAt as any)?.toMillis?.() || new Date(b.createdAt).getTime() || 0;
      return timeB - timeA;
    });
  },

  async findById(accountId: string, userId: string): Promise<Account | null> {
    const doc = await accountsCollection.doc(accountId).get()
    if (!doc.exists) return null

    const data = doc.data()!
    if (data.user_id !== userId) return null

    return { id: doc.id, ...(data as Omit<Account, 'id'>) }
  },

  async create(data: CreateAccountData, userId: string): Promise<Account> {
    const payload = {
      ...data,
      user_id: userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = await accountsCollection.add(payload)
    const created = await docRef.get()

    return { id: docRef.id, ...(created.data() as Omit<Account, 'id'>) }
  },

  async update(accountId: string, data: UpdateAccountData, userId: string): Promise<Account> {
    const docRef = accountsCollection.doc(accountId)

    await docRef.update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    return { id: docRef.id, ...(updated.data() as Omit<Account, 'id'>) }
  },

  async delete(accountId: string, userId: string): Promise<void> {
    await accountsCollection.doc(accountId).delete()
  },

  async isUsedInTransactions(accountId: string, userId: string): Promise<boolean> {
  const snapshot = await adminDb.collection('transactions')
    .where('account_id', '==', accountId)
    .where('user_id', '==', userId)
    .limit(1)
    .get()

  if (!snapshot.empty) return true

  // Verificar también como cuenta destino
  const snapshotDest = await adminDb.collection('transactions')
    .where('to_account_id', '==', accountId)
    .where('user_id', '==', userId)
    .limit(1)
    .get()

  return !snapshotDest.empty
},
}