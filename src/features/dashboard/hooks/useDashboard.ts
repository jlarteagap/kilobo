import { useMemo }            from 'react'
import { useAccounts }        from '@/features/accounts/hooks/useAccounts'
import { useTransactions }    from '@/features/transactions/hooks/useTransactions'
import { useDebts }           from '@/features/debts/hooks/useDebts'
import { useCredits }         from '@/features/credits/hooks/useCredits'
import { useBudgetProgress }  from '@/features/budgets/hooks/useBudgets'
import { useAccountsDashboard } from '@/features/accounts/hooks/useAccountsDashboard'
import { useFinancialMetrics }  from './useFinancialMetrics'
import { useInvestments }     from '@/features/investments/hooks/useInvestments'

export function useDashboard() {
  const { data: accounts     = [], isLoading: loadingAccounts     } = useAccounts()
  const { data: transactions = [], isLoading: loadingTransactions } = useTransactions()
  const { data: debts        = [], isLoading: loadingDebts        } = useDebts()
  const { data: credits      = [], isLoading: loadingCredits      } = useCredits()
  const { data: investments  = [], isLoading: loadingInvestments  } = useInvestments()
  const budgetProgress = useBudgetProgress()

  const accountsDashboard = useAccountsDashboard(accounts, debts, investments)
  const isLoading = loadingAccounts || loadingTransactions || loadingDebts || loadingCredits || loadingInvestments

  const metrics = useFinancialMetrics({ transactions, debts, budgetProgress })

  const activeCredits = useMemo(() =>
    credits.filter((c) => c.status === 'ACTIVE'),
    [credits]
  )

  return {
    isLoading,
    accountsDashboard,
    activeCredits,
    investments,
    ...metrics,
  }
}
