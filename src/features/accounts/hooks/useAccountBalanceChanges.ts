import { useQuery } from '@tanstack/react-query'
import { AccountBalanceChange } from '@/types/account'

// Cliente HTTP que añade el token automáticamente
async function authFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
}

// Query key centralizada
export const accountChangeKeys = {
  all: (accountIds: string[]) => ['account-balance-changes', accountIds] as const,
}

// El repositorio serializa createdAt como ISO string antes de devolver al API.
// Este tipo refleja lo que llega al cliente desde la response JSON.
interface RawAccountBalanceChange extends Omit<AccountBalanceChange, 'createdAt'> {
  createdAt: string
}

function mapChange(raw: RawAccountBalanceChange | null): AccountBalanceChange | null {
  if (!raw) return null
  return { ...raw, createdAt: new Date(raw.createdAt) }
}

// Lee el último cambio de balance para cada cuenta en paralelo.
// Con máximo 10 cuentas por usuario la carga es despreciable.
export function useAccountBalanceChanges(accountIds: string[]) {
  const ids = accountIds.filter(Boolean)
  const uniqueIds = [...new Set(ids)]

  return useQuery({
    queryKey: accountChangeKeys.all(uniqueIds),
    queryFn: async (): Promise<Record<string, AccountBalanceChange>> => {
      const entries = await Promise.all(
        uniqueIds.map(async (accountId) => {
          const res = await authFetch(`/api/account-balance-changes?account_id=${encodeURIComponent(accountId)}`)
          if (!res.ok) throw new Error('Error al obtener el último cambio')
          const data = await res.json()
          return [accountId, mapChange(data.change)] as const
        })
      )

      return Object.fromEntries(
        entries
          .filter(([, change]) => change !== null)
          .map(([accountId, change]) => [accountId, change])
      ) as Record<string, AccountBalanceChange>
    },
    enabled: uniqueIds.length > 0,
    staleTime: 1000 * 60, // 1 minuto en caché
  })
}
