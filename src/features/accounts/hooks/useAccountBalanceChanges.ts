import { useQuery } from '@tanstack/react-query'
import { AccountBalanceChange } from '@/types/account'
import { startOfDailyPeriod } from '../utils/daily-period.utils'

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

// Query key centralizada. Incluye `before` (límite del periodo diario local):
// al cruzar las 4:00 AM el key cambia y el badge se recalcula.
export const accountChangeKeys = {
  all: (before: string, accountIds: string[]) =>
    ['account-balance-changes', before, accountIds] as const,
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

// Lee la ancla de la variación diaria para cada cuenta en paralelo: el cambio
// más reciente anterior al inicio del periodo (4:00 AM local). Con máximo 10
// cuentas por usuario la carga es despreciable.
export function useAccountBalanceChanges(accountIds: string[]) {
  const ids = accountIds.filter(Boolean)
  const uniqueIds = [...new Set(ids)]
  const before = startOfDailyPeriod()

  return useQuery({
    queryKey: accountChangeKeys.all(before.toISOString(), uniqueIds),
    queryFn: async (): Promise<Record<string, AccountBalanceChange>> => {
      const entries = await Promise.all(
        uniqueIds.map(async (accountId) => {
          const res = await authFetch(
            `/api/account-balance-changes?account_id=${encodeURIComponent(
              accountId
            )}&before=${encodeURIComponent(before.toISOString())}`
          )
          if (!res.ok) throw new Error('Error al obtener la variación diaria')
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
