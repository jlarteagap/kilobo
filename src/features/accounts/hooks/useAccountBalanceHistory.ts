import { useQuery } from '@tanstack/react-query'
import { AccountBalanceChange } from '@/types/account'

const HISTORY_LIMIT = 10

// Los timestamps llegan serializados como ISO string desde la response JSON.
interface RawAccountBalanceChange extends Omit<AccountBalanceChange, 'createdAt'> {
  createdAt: string
}

// Historial reciente de una cuenta (newest-first). Query perezosa: solo se
// dispara cuando el diálogo de la tarjeta está abierto y hay accountId.
export function useAccountBalanceHistory(accountId: string | null, limit = HISTORY_LIMIT) {
  return useQuery({
    queryKey: ['account-balance-history', accountId, limit] as const,
    queryFn: async (): Promise<AccountBalanceChange[]> => {
      const res = await fetch(
        `/api/account-balance-changes?account_id=${encodeURIComponent(
          accountId!
        )}&limit=${limit}`
      )
      if (!res.ok) throw new Error('Error al obtener el historial de cambios')
      const data = await res.json()
      return (data.changes as RawAccountBalanceChange[]).map((raw) => ({
        ...raw,
        createdAt: new Date(raw.createdAt),
      }))
    },
    enabled: Boolean(accountId),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  })
}