import { supabase } from '@/lib/supabase'
import { Account } from '@/types/account'

export interface AccountDB {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  created_at: string
  updated_at: string
}

// Transform database record to Account type
function dbToAccount(dbAccount: AccountDB): Account {
  return {
    id: dbAccount.id,
    name: dbAccount.name,
    type: dbAccount.type as Account['type'],
    balance: dbAccount.balance,
    currency: dbAccount.currency,
  }
}

// Transform Account to database record
function accountToDb(account: Account): Omit<AccountDB, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: account.name,
    type: account.type,
    balance: account.balance,
    currency: account.currency,
  }
}

export const accountService = {
  // Get all accounts
  async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching accounts:', error)
      throw new Error(`Error al obtener las cuentas: ${error.message}`)
    }

    return (data || []).map(dbToAccount)
  },

  // Get account by ID
  async getAccountById(id: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching account:', error)
      throw new Error(`Error al obtener la cuenta: ${error.message}`)
    }

    return data ? dbToAccount(data) : null
  },

  // Create new account
  async createAccount(account: Omit<Account, 'id'>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .insert([accountToDb(account as Account)])
      .select()
      .single()

    if (error) {
      console.error('Error creating account:', error)
      throw new Error(`Error al crear la cuenta: ${error.message}`)
    }

    return dbToAccount(data)
  },

  // Update account
  async updateAccount(id: string, account: Partial<Account>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update(accountToDb(account as Account))
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating account:', error)
      throw new Error(`Error al actualizar la cuenta: ${error.message}`)
    }

    return dbToAccount(data)
  },

  // Delete account
  async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting account:', error)
      throw new Error(`Error al eliminar la cuenta: ${error.message}`)
    }
  },
}
