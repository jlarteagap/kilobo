// features/accounts/hooks/useAccountsDashboard.ts
import { useMemo } from "react"
import { Account, AccountType, AssetDetail, CurrencyGroup } from "@/types/account"
import {
  getAccountTypeDetails,
  getValueInBOB,
  formatCurrency,
} from "@/features/accounts/utils/account-display.utils"

// Mapa de colores hex por tipo — para AssetDetail
const ASSET_HEX_COLORS: Record<string, string> = {
  'text-blue-500':    '#3b82f6',
  'text-purple-500':  '#a855f7',
  'text-emerald-500': '#10b981',
  'text-orange-500':  '#f97316',
  'text-red-500':     '#ef4444',
  'text-gray-500':    '#6b7280',
}

export function useAccountsDashboard(accounts: Account[]) {

  // ── Total activos en BOB ───────────────────────────────────────────────────
  const totalGlobalAssetsInBOB = useMemo(
    () => accounts.reduce((acc, account) => {
      if (account.type === 'DEBT') return acc
      return acc + getValueInBOB(account)
    }, 0),
    [accounts]
  )

  // ── Total pasivos en BOB ───────────────────────────────────────────────────
  const totalGlobalLiabilitiesInBOB = useMemo(
    () => accounts.reduce((acc, account) => {
      if (account.type !== 'DEBT') return acc
      return acc + getValueInBOB(account)
    }, 0),
    [accounts]
  )

  const netWorthInBOB     = totalGlobalAssetsInBOB - totalGlobalLiabilitiesInBOB
  const netWorthPositive  = netWorthInBOB >= 0

  // ── Asset detail ───────────────────────────────────────────────────────────
  const assetsDetail: AssetDetail[] = useMemo(
    () => accounts.map((account) => {
      const details    = getAccountTypeDetails(account.type)
      const valueInBOB = getValueInBOB(account)

      const weight = account.type === 'DEBT'
        ? 'N/A'
        : `${((valueInBOB / totalGlobalAssetsInBOB) * 100).toFixed(1)}%`

      // Color hex en lugar de clases Tailwind combinadas
      const hexColor = ASSET_HEX_COLORS[details.color] ?? '#6b7280'

      return {
        id:             account.id,
        name:           account.name,
        category:       details.label,
        weight,
        formattedValue: formatCurrency(account.balance, account.currency),
        icon:           details.icon,
        color:          hexColor,  // ← hex puro, no clases Tailwind
      }
    }),
    [accounts, totalGlobalAssetsInBOB]
  )

  // ── Currency groups ────────────────────────────────────────────────────────
  const currencyGroups: CurrencyGroup[] = useMemo(() => {
    const currencies = Array.from(new Set(accounts.map((a) => a.currency)))

    return currencies.map((currency) => {
      const currencyAccounts = accounts.filter((a) => a.currency === currency)

      const totalWealth = currencyAccounts.reduce((acc, account) => {
        if (account.type === 'DEBT') return acc - account.balance
        return acc + account.balance
      }, 0)

      const totalAssets = currencyAccounts.reduce((acc, account) => {
        if (account.type === 'DEBT') return acc
        return acc + account.balance
      }, 0)

      const assetsByType = currencyAccounts.reduce(
        (acc, account) => {
          if (account.type === 'DEBT') return acc
          const existing = acc.find((a) => a.type === account.type)
          if (existing) {
            existing.value += account.balance
          } else {
            acc.push({ type: account.type, value: account.balance })
          }
          return acc
        },
        [] as { type: AccountType; value: number }[]
      )

      const assets = assetsByType
        .map((item) => {
          const details = getAccountTypeDetails(item.type)
          return {
            name:    details.label,
            value:   item.value,
            color:   ASSET_HEX_COLORS[details.color] ?? '#6b7280',  // ← hex
            percent: Math.round((item.value / totalAssets) * 100) || 0,
            currency,
          }
        })
        .sort((a, b) => b.value - a.value)

      return {
        currency,
        totalWealth,
        formattedTotal: formatCurrency(totalWealth, currency),
        assets,
      }
    })
  }, [accounts])

  return {
    assetsDetail,
    currencyGroups,
    // ← nuevos valores para AssetsTable
    totalAssetsFormatted:      formatCurrency(totalGlobalAssetsInBOB,      'BOB'),
    totalLiabilitiesFormatted: formatCurrency(totalGlobalLiabilitiesInBOB, 'BOB'),
    netWorthFormatted:         formatCurrency(Math.abs(netWorthInBOB),     'BOB'),
    netWorthInBOB,
    netWorthRaw: netWorthInBOB,
    netWorthPositive,
  }
}