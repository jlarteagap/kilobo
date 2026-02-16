import { addDoc, deleteDoc, doc, getDocs, query, updateDoc } from 'firebase/firestore'
import { transactionsCollection } from '@/lib/firebase'
import { Transaction, CreateTransactionData } from "@/types/transaction"

export const transactionService = {
    async getAll(): Promise<Transaction[]> {
        const q = query(
            transactionsCollection
        )
        const snapshot = await getDocs(q)
        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Transaction, "id">)
        }))

        return transactions
    },

    async create(data: CreateTransactionData): Promise<Transaction> {
        const now = new Date().toISOString()
        const transactionData = {
            ...data,
            user_id: '', // TODO: Get from auth context
            currency: data.currency || 'USD', // Use currency from data, fallback to USD
            status: 'COMPLETED' as const,
            recurrence_interval: data.is_recurring ? null : null, // Set based on your business logic
            created_at: now,
            updated_at: now,
            to_account_id: data.to_account_id ?? null,
            category_id: data.category_id ?? null,
            description: data.description ?? null,
            payment_method: data.payment_method ?? null,
            is_recurring: data.is_recurring ?? false,
        }
        
        const docRef = await addDoc(transactionsCollection, transactionData)
        return {
            id: docRef.id,
            ...transactionData
        }
    },

    async update(id: string, data: Partial<CreateTransactionData>): Promise<void> {
        const docRef = doc(transactionsCollection, id)
        await updateDoc(docRef, data)
    },

    async delete(id: string): Promise<void> {
        const docRef = doc(transactionsCollection, id)
        await deleteDoc(docRef)
    }
}