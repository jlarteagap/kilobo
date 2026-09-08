import { accountsRepository } from '@/repositories/accounts.repository'
import { accountBalanceHistoryRepository } from '@/repositories/account-balance-history.repository'
import { CreateAccountInput, UpdateAccountInput } from '@/lib/validations/account.schema'
import { Account } from '@/types/account'
import { adminDb } from '@/lib/firebase.admin'
import { FieldValue } from 'firebase-admin/firestore'

export const accountsService = {
    async getAccounts(userId: string): Promise<Account[]> {
        return accountsRepository.findAll(userId)
    },

    async createAccount(data: CreateAccountInput, userId: string): Promise<Account> {
    // Regla de negocio: máximo 10 cuentas por usuario
    const existing = await accountsRepository.findAll(userId)
    if (existing.length >= 10) {
      throw new Error('Has alcanzado el límite máximo de cuentas.')
    }

    return accountsRepository.create(data, userId)
  },

  async updateAccount(
    accountId: string,
    data: UpdateAccountInput,
    userId: string
  ): Promise<Account> {
    // Verificar que la cuenta existe y pertenece al usuario
    const account = await accountsRepository.findById(accountId, userId)
    if (!account) {
      throw new Error('Cuenta no encontrada.')
    }

    // Si cambia el balance, registrar el cambio de forma atómica en un batch
    if (data.balance !== undefined && data.balance !== account.balance) {
      const batch = adminDb.batch()

      batch.update(adminDb.collection('accounts').doc(accountId), {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      })

      accountBalanceHistoryRepository.addInBatch(
        batch,
        accountId,
        account.balance,
        data.balance,
        'ACCOUNT',
        userId
      )

      await batch.commit()

      const updated = await adminDb.collection('accounts').doc(accountId).get()
      return { id: accountId, ...(updated.data() as Omit<Account, 'id'>) }
    }

    return accountsRepository.update(accountId, data)
  },

async deleteAccount(accountId: string, userId: string): Promise<void> {
  const account = await accountsRepository.findById(accountId, userId)
  if (!account) throw new Error('Cuenta no encontrada.')

  const inUse = await accountsRepository.isUsedInTransactions(accountId, userId)
  if (inUse) {
    throw new Error('No se puede eliminar una cuenta que tiene transacciones asociadas.')
  }

  return accountsRepository.delete(accountId)
},
}

