import { useMemo } from 'react'
import { useActiveAccounts } from './useAccounts'
import { useAccountBalanceChanges } from './useAccountBalanceChanges'

// Variación diaria calculada de una cuenta: delta neto del periodo (balance
// actual − ancla), el balance ancla (cierre del periodo anterior) y la fecha
// del último cambio con ese valor (base de los estados neutros del badge).
export interface AccountDailyVariation {
  delta: number
  anchorBalance: number
  lastChangeAt: Date
}

// Hoista el cálculo del delta de la variación diaria (hoy dentro de
// AccountCard) a un solo punto compartido por la tarjeta, el Patrimonio Total
// y el ordenamiento. Reusa la caché de useAccounts y useAccountBalanceChanges.
// Devuelve solo las cuentas que tienen ancla de comparación.
export function useAccountDailyDeltas(): Record<string, AccountDailyVariation> {
  const { data: accounts = [] } = useActiveAccounts()
  const accountIds = accounts.map((account) => account.id)
  const { data: lastChanges = {} } = useAccountBalanceChanges(accountIds)

  return useMemo(() => {
    const deltas: Record<string, AccountDailyVariation> = {}
    for (const account of accounts) {
      const anchor = lastChanges[account.id]
      if (!anchor) continue
      deltas[account.id] = {
        delta: account.balance - anchor.new_balance,
        anchorBalance: anchor.new_balance,
        lastChangeAt: anchor.createdAt,
      }
    }
    return deltas
  }, [accounts, lastChanges])
}