import { useMemo } from 'react'
import { useActiveAccounts } from '@/features/accounts/hooks/useAccounts'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { projectBalance } from '@/lib/forecast/projection'
import type { ProjectionResult } from '@/lib/forecast/projection'
import { format, subMonths } from 'date-fns'

const ymd = (d: Date) => format(d, 'yyyy-MM-dd')

export function useBalanceProjection(): ProjectionResult & { isLoading: boolean; hasData: boolean } {
  const { data: accounts = [], isLoading: loadingAccounts } = useActiveAccounts()

  /**
   * La proyección necesita historial para detectar recurrencias y promedios
   * diarios, así que no puede funcionar con una sola página. Pero tampoco
   * necesita TODO el historial: 12 meses es la ventana útil, y acotarla evita
   * que esta tarjeta sea la que vuelva a traer el historial completo.
   */
  const filters = useMemo(() => ({
    from: ymd(subMonths(new Date(), 12)),
    to: ymd(new Date()),
  }), [])

  const { data, isLoading: loadingTransactions } = useTransactions(filters)
  const transactions = useMemo(() => (data?.pages ?? []).flatMap((p) => p.items), [data])

  const projection = useMemo(
    () => projectBalance(accounts, transactions),
    [accounts, transactions],
  )

  return {
    ...projection,
    isLoading: loadingAccounts || loadingTransactions,
    hasData: accounts.length > 0,
  }
}
