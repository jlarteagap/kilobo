import { useMemo } from "react"
import { Account, AccountType, AssetDetail, CurrencyGroup } from "@/types/account"
import {
  getAccountTypeDetails,
  getValueInBOB,
  formatCurrency,
} from "@/features/accounts/utils/account-display.utils"
import { Debt } from "@/types/debt"
import { convertToBOB } from "@/lib/config/exchange-rates"
import type { Investment } from "@/types/investment"

export interface CurrencyBreakdown {
  currency: string
  balance: number
  formattedBalance: string
  invested: number
  formattedInvested: string
}

export function useAccountsDashboard(
  accounts: Account[],
  debts: Debt[] = [],
  investments: Investment[] = []
) {
  // Las cuentas archivadas quedan fuera del patrimonio y de los desgloses.
  const activeAccounts = useMemo(
    () => accounts.filter((a) => !a.archived),
    [accounts]
  )

  // ── Multi-currency breakdown ──────────────────────────────────────────────
  const currencies = useMemo(
    () => Array.from(new Set(activeAccounts.map((a) => a.currency))),
    [activeAccounts]
  )

  const investmentByCurrency = useMemo(() => {
    return investments.reduce<Record<string, number>>((acc, inv) => {
      acc[inv.currency] = (acc[inv.currency] ?? 0) + inv.amount
      return acc
    }, {})
  }, [investments])

  const currencyBreakdown: CurrencyBreakdown[] = useMemo(
    () => currencies.map((currency) => {
      const balance = activeAccounts
        .filter((a) => a.currency === currency)
        .reduce((sum, a) => sum + a.balance, 0)
      const invested = investmentByCurrency[currency] ?? 0
      return {
        currency,
        balance,
        formattedBalance: formatCurrency(balance, currency),
        invested,
        formattedInvested: formatCurrency(invested, currency),
      }
    }),
    [currencies, activeAccounts, investmentByCurrency]
  )

  const totalInvestedByCurrency = investmentByCurrency

  // ── Total activos en BOB ───────────────────────────────────────────────────
  const totalGlobalAssetsInBOB = useMemo(
    () => activeAccounts.reduce((acc, account) => acc + getValueInBOB(account), 0),
    [activeAccounts]
  )

  // ── Total pasivos en BOB ───────────────────────────────────────────────────
  const totalGlobalLiabilitiesInBOB = useMemo(
    () => debts
      .filter((d) => d.status === 'ACTIVE' && d.type === 'RECEIVED')
      .reduce((acc, debt) => {
        const pending = debt.amount - debt.paid_amount
        return acc + convertToBOB(pending, debt.currency)
      }, 0),
    [debts]
  )

  const netWorthInBOB     = totalGlobalAssetsInBOB - totalGlobalLiabilitiesInBOB
  const netWorthPositive  = netWorthInBOB >= 0

  // ── Net worth solo BOB (sin conversión de otras monedas) ───────────────────
  const netWorthBOBOnly = useMemo(() => {
    const bobBalance = activeAccounts
      .filter((a) => a.currency === 'BOB')
      .reduce((sum, a) => sum + a.balance, 0)
    const bobDebts = debts
      .filter((d) => d.status === 'ACTIVE' && d.type === 'RECEIVED' && d.currency === 'BOB')
      .reduce((acc, debt) => acc + (debt.amount - debt.paid_amount), 0)
    return bobBalance - bobDebts
  }, [activeAccounts, debts])

  // ── Asset detail ───────────────────────────────────────────────────────────
  const assetsDetail: AssetDetail[] = useMemo(
    () => activeAccounts.map((account) => {
      const details    = getAccountTypeDetails(account.type)
      const valueInBOB = getValueInBOB(account)

      const weight = `${((valueInBOB / totalGlobalAssetsInBOB) * 100).toFixed(1)}%`

      const hexColor = details.color

      return {
        id:             account.id,
        name:           account.name,
        category:       details.label,
        weight,
        formattedValue: formatCurrency(account.balance, account.currency),
        icon:           details.icon,
        color:          hexColor,
      }
    }),
    [activeAccounts, totalGlobalAssetsInBOB]
  )

  // ── Currency groups ────────────────────────────────────────────────────────
  const currencyGroups: CurrencyGroup[] = useMemo(() => {
    return currencies.map((currency) => {
      const currencyAccounts = activeAccounts.filter((a) => a.currency === currency)
      const totalAssets = currencyAccounts.reduce((acc, account) => acc + account.balance, 0)

      const assetsByType = currencyAccounts.reduce(
        (acc, account) => {
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
            color:   details.color,
            percent: Math.round((item.value / totalAssets) * 100) || 0,
            currency,
          }
        })
        .sort((a, b) => b.value - a.value)

      return {
        currency,
        totalWealth: totalAssets,
        formattedTotal: formatCurrency(totalAssets, currency),
        assets,
      }
    })
  }, [currencies, activeAccounts])

  const totalInvestedFormatted = Object.entries(totalInvestedByCurrency)
    .map(([c, a]) => formatCurrency(a, c))
    .join(' · ')

  const netWorthBOBOnlyPositive = netWorthBOBOnly >= 0

  return {
    assetsDetail,
    currencyGroups,
    currencyBreakdown,
    totalInvestedByCurrency,
    totalInvestedFormatted,
    totalAssetsFormatted:      formatCurrency(totalGlobalAssetsInBOB, 'BOB'),
    totalLiabilitiesFormatted: formatCurrency(totalGlobalLiabilitiesInBOB, 'BOB'),
    netWorthFormatted:         formatCurrency(Math.abs(netWorthInBOB), 'BOB'),
    netWorthInBOB,
    netWorthRaw: netWorthInBOB,
    netWorthPositive,
    netWorthBOBOnly,
    netWorthBOBOnlyPositive,
  }
}