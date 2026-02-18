import { useMemo } from "react"
import { Account, AccountType, AssetDetail } from "@/types/account"
import { CurrencyGroup } from "@/types/account"

import {
  getAccountTypeDetails,
  getValueInBOB,
  formatCurrency,
} from "@/features/accounts/utils/account-display.utils"

export function useAccountsDashboard(accounts: Account[]) {
  const totalGlobalAssetsInBOB = useMemo(
    () =>
      accounts.reduce((acc, account) => {
        if (account.type === "DEBT") return acc
        return acc + getValueInBOB(account)
      }, 0),
    [accounts]
  )

  const assetsDetail: AssetDetail[] = useMemo(
    () =>
      accounts.map((account) => {
        const details = getAccountTypeDetails(account.type)
        const valueInBOB = getValueInBOB(account)

        const weight =
          account.type === "DEBT"
            ? "N/A"
            : `${((valueInBOB / totalGlobalAssetsInBOB) * 100).toFixed(1)}%`

        return {
          id: account.id,
          name: account.name,
          category: details.label,
          weight,
          formattedValue: formatCurrency(account.balance, account.currency),
          icon: details.icon,
          color: `${details.color} ${details.color
            .replace("text-", "bg-")
            .replace("500", "100")}`,
        }
      }),
    [accounts, totalGlobalAssetsInBOB]
  )

  const currencyGroups: CurrencyGroup[] = useMemo(() => {
    const currencies = Array.from(new Set(accounts.map((a) => a.currency)))

    return currencies.map((currency) => {
      const currencyAccounts = accounts.filter((a) => a.currency === currency)

      const totalWealth = currencyAccounts.reduce((acc, account) => {
        if (account.type === "DEBT") return acc - account.balance
        return acc + account.balance
      }, 0)

      const totalAssets = currencyAccounts.reduce((acc, account) => {
        if (account.type === "DEBT") return acc
        return acc + account.balance
      }, 0)

      const assetsByType = currencyAccounts.reduce(
        (acc, account) => {
          if (account.type === "DEBT") return acc
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
            name: details.label,
            value: item.value,
            color: details.bg,
            percent: Math.round((item.value / totalAssets) * 100) || 0,
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

  return { assetsDetail, currencyGroups }
}