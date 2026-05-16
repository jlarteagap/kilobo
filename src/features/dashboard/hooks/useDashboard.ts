// features/dashboard/hooks/useDashboard.ts
import { useAccounts }        from '@/features/accounts/hooks/useAccounts'
import { useTransactions }    from '@/features/transactions/hooks/useTransactions'
import { useDebts }           from '@/features/debts/hooks/useDebts'
import { useBudgetProgress }  from '@/features/budgets/hooks/useBudgets'
import { useAccountsDashboard } from '@/features/accounts/hooks/useAccountsDashboard'
import { useFinancialMetrics }  from './useFinancialMetrics'

export function useDashboard() {
  const { data: accounts     = [], isLoading: loadingAccounts     } = useAccounts()
  const { data: transactions = [], isLoading: loadingTransactions } = useTransactions()
  const { data: debts        = [], isLoading: loadingDebts        } = useDebts()
  const budgetProgress = useBudgetProgress()

  const accountsDashboard = useAccountsDashboard(accounts, debts)
  const isLoading = loadingAccounts || loadingTransactions || loadingDebts

  const metrics = useFinancialMetrics({ transactions, debts, budgetProgress })

  return {
    isLoading,
    accountsDashboard,
    ...metrics,
  }
}