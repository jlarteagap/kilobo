import { accountsRepository } from '@/repositories/accounts.repository'
import { CreateAccountInput, UpdateAccountInput } from '@/lib/validations/account.schema'
import { Account } from '@/types/account'

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

