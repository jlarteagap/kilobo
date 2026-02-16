import {addDoc, query, deleteDoc, doc, updateDoc, getDocs} from 'firebase/firestore'
import {Account, CreateAccountData} from '@/types/account'
import { accountsCollection } from '@/lib/firebase'

export const accountsService = {
    async getAccounts(): Promise<Account[]> {
        const q = query(accountsCollection)

        const snapshot = await getDocs(q)
        const accounts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data() as Omit<Account, "id">
        }))
        return accounts;
    },

    async create(data: CreateAccountData): Promise<Account> {
        // Ensure we don't pass undefined id to Firestore
        const { id, ...accountData } = data as any;
        
        const newAccount = {
            ...accountData,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        const docRef = await addDoc(accountsCollection, newAccount)
        return {
            id: docRef.id,
            ...newAccount
        }
    },

    async update(id: string, data: Partial<CreateAccountData>): Promise<void> {
        const docRef = doc(accountsCollection, id)
        await updateDoc(docRef, data)
    },

    async delete(id: string): Promise<void> {
        const docRef = doc(accountsCollection, id)
        await deleteDoc(docRef)
    }
}

