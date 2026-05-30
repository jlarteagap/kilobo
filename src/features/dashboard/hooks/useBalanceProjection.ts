import { useMemo } from 'react'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { projectBalance } from '@/lib/forecast/projection'
import type { ProjectionResult } from '@/lib/forecast/projection'

export function useBalanceProjection(): ProjectionResult & { isLoading: boolean } {
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts()
  const { data: transactions = [], isLoading: loadingTransactions } = useTransactions()

  const projection = useMemo(
    () => projectBalance(accounts, transactions),
    [accounts, transactions],
  )

  return {
    ...projection,
    isLoading: loadingAccounts || loadingTransactions,
  }
}
