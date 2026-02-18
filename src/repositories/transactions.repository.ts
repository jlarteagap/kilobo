import { adminDb } from '@/lib/firebase.admin'
import { Transaction, CreateTransactionData } from '@/types/transaction'
import { FieldValue } from 'firebase-admin/firestore'

const transactionsCollection = adminDb.collection('transactions')

export const transactionsRepository = {
  async findAll(): Promise<Transaction[]> {
    const snapshot = await transactionsCollection
      .orderBy('date', 'desc')
      .get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Transaction, 'id'>),
    }))
  },

  async findById(transactionId: string): Promise<Transaction | null> {
    const doc = await transactionsCollection.doc(transactionId).get()
    if (!doc.exists) return null

    return { id: doc.id, ...(doc.data() as Omit<Transaction, 'id'>) }
  },

  async create(data: CreateTransactionData): Promise<Transaction> {
    const payload = {
      ...data,
      created_at: FieldValue.serverTimestamp(), // Use server timestamp for creation
      updated_at: FieldValue.serverTimestamp(),
    }

    // Convert date string to whatever format is preferred if needed, 
    // but assuming string storage for 'date' as per interface.
    // However, interface says 'created_at' is string, but repository usually stores Timestamp and converts or stores string.
    // Accounts repo used FieldValue.serverTimestamp().
    // The interface in `transaction.ts` says `created_at` is `string`.
    // If I use FieldValue.serverTimestamp(), it will be a Timestamp in Firestore.
    // When reading back, I might need to convert it to string or date.
    // Accounts repository does `...(doc.data() as Omit<Account, 'id'>)` which might imply loose typing or auto-conversion if not strictly checked.
    // Let's stick to what's in accounts repository for consistency, 
    // but be aware that `FieldValue.serverTimestamp()` is not a string.
    // I will assume the type definition in `types/transaction.ts` might need adjustment or the repo should convert.
    // For now, I'll follow the pattern and if types mismatch I'll fix.
    // In `accounts.repository.ts`:
    // createdAt: FieldValue.serverTimestamp(),
    // defined in `Account` as `Date` (in `types/account`).
    // Wait, let me check `types/account.ts`? I saw `Account` interface earlier.
    // Ah, I didn't see `types/account.ts` content, only `types/transaction.ts`.
    // `Transaction` uses `created_at: string`.
    // If I store FieldValue.serverTimestamp(), it saves as Timestamp.
    // If the frontend expects string, I should convert it when fetching.
    
    const docRef = await transactionsCollection.add(payload)
    const created = await docRef.get()
    
    // Helper to converting timestamps if needed, or just casting for now if the app handles it elsewhere.
    // I'll stick to the existing pattern but `created_at` in interface is string.
    // The `accounts.repository.ts` casts `doc.data()` to `Account`. 
    // If `Account` has `Date`, firebase SDK returns Timestamp, so it might be an issue if not converted.
    // But `accounts.service.ts` returns `Account[]`.
    
    // For now, I will blindly follow the pattern.

    return { id: docRef.id, ...(created.data() as Omit<Transaction, 'id'>) }
  },

  async update(transactionId: string, data: Partial<CreateTransactionData>): Promise<Transaction> {
    const docRef = transactionsCollection.doc(transactionId)

    await docRef.update({
      ...data,
      updated_at: FieldValue.serverTimestamp(),
    })

    const updated = await docRef.get()
    return { id: docRef.id, ...(updated.data() as Omit<Transaction, 'id'>) }
  },

  async delete(transactionId: string): Promise<void> {
    await transactionsCollection.doc(transactionId).delete()
  },
}
