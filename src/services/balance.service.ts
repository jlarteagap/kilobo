import type { Transaction } from '@/types/transaction'
import type { Account } from '@/types/account'

async function authFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}

function getRevertBalanceOps(
  tx: Transaction,
  accounts: { id: string; balance: number }[]
): Array<{ id: string; balance: number }> {
  const source = accounts.find((a) => a.id === tx.account_id)
  const dest   = accounts.find((a) => a.id === tx.to_account_id)
  const ops: Array<{ id: string; balance: number }> = []

  switch (tx.type) {
    case 'INCOME':
      if (source) ops.push({ id: source.id, balance: source.balance - tx.amount })
      break
    case 'EXPENSE':
    case 'TRANSFER':
    case 'SAVING':
      if (source) ops.push({ id: source.id, balance: source.balance + tx.amount })
      if (dest)   ops.push({ id: dest.id,   balance: dest.balance   - tx.amount })
      break
  }

  return ops
}

export const balanceService = {
  async applyBalanceForCreate(
    data: { type: string; account_id: string; to_account_id?: string | null; amount: number },
    accounts: Account[]
  ): Promise<void> {
    const sourceAccount = accounts.find((a) => a.id === data.account_id)
    const destAccount = data.to_account_id ? accounts.find((a) => a.id === data.to_account_id) : null

    const updates: Array<{ id: string; balance: number }> = []

    if (data.type === 'INCOME' && sourceAccount) {
      updates.push({ id: data.account_id, balance: sourceAccount.balance + data.amount })
    } else if (data.type === 'EXPENSE' && sourceAccount) {
      updates.push({ id: data.account_id, balance: sourceAccount.balance - data.amount })
    } else if (data.type === 'TRANSFER' || data.type === 'SAVING') {
      if (sourceAccount) {
        updates.push({ id: data.account_id, balance: sourceAccount.balance - data.amount })
      }
      if (destAccount && data.to_account_id) {
        updates.push({ id: data.to_account_id, balance: destAccount.balance + data.amount })
      }
    }

    await Promise.all(
      updates.map((op) =>
        authFetch(`/api/accounts/${op.id}`, {
          method: 'PUT',
          body: JSON.stringify({ balance: op.balance }),
        })
      )
    )
  },

  async revertBalanceForDelete(
    tx: Transaction,
    accounts: Account[]
  ): Promise<void> {
    const ops = getRevertBalanceOps(tx, accounts)
    await Promise.all(
      ops.map((op) =>
        authFetch(`/api/accounts/${op.id}`, {
          method: 'PUT',
          body: JSON.stringify({ balance: op.balance }),
        })
      )
    )
  },
}
