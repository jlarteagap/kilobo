import { accountsRepository } from '@/repositories/accounts.repository'
import { CreateAccountInput, UpdateAccountInput } from '@/lib/validations/account.schema'
import { Account } from '@/types/account'

export const accountsService = {
    async getAccounts(): Promise<Account[]> {
        return accountsRepository.findAll()
    },

    async createAccount(data: CreateAccountInput): Promise<Account> {
    // Regla de negocio: máximo 10 cuentas por usuario
    const existing = await accountsRepository.findAll()
    if (existing.length >= 10) {
      throw new Error('Has alcanzado el límite máximo de cuentas.')
    }

    return accountsRepository.create(data)
  },

  async updateAccount(
    accountId: string,
    data: UpdateAccountInput
  ): Promise<Account> {
    // Verificar que la cuenta existe y pertenece al usuario
    const account = await accountsRepository.findById(accountId)
    if (!account) {
      throw new Error('Cuenta no encontrada.')
    }

    return accountsRepository.update(accountId, data)
  },

async deleteAccount(accountId: string): Promise<void> {
    const account = await accountsRepository.findById(accountId)
    if (!account) {
      throw new Error('Cuenta no encontrada.')
    }

    // Regla de negocio: no borrar cuentas con balance > 0
    if (account.balance > 0) {
      throw new Error('No puedes eliminar una cuenta con balance positivo.')
    }

    return accountsRepository.delete(accountId)
  },
}

