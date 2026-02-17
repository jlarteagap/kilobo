"use client"

import { useEffect, useState } from "react"
import AppLayout from "@/components/layout/AppLayout"
import { CashflowSection } from "@/features/dashboard/CashflowSection"
import { AssetsSection, CurrencyGroup } from "@/features/dashboard/AssetsSection"
import { AssetsTable, AssetDetail } from "@/features/dashboard/AssetsTable"
import { accountsService } from "@/services/accountsService"
import { Account, AccountType } from "@/types/account"
import { Wallet, Building2, Banknote, Bitcoin, CreditCard, PiggyBank, LucideIcon } from "lucide-react"

// Helper to map account types to display properties
const getAccountTypeDetails = (type: AccountType): { label: string; icon: LucideIcon; color: string; bg: string } => {
  switch (type) {
    case "BANK":
      return { label: "Banco", icon: Building2, color: "text-blue-500", bg: "bg-blue-500" }
    case "WALLET":
      return { label: "Billetera Digital", icon: Wallet, color: "text-purple-500", bg: "bg-purple-500" }
    case "CASH":
      return { label: "Efectivo", icon: Banknote, color: "text-emerald-500", bg: "bg-emerald-500" }
    case "CRYPTO":
      return { label: "Cripto", icon: Bitcoin, color: "text-orange-500", bg: "bg-orange-500" }
    case "DEBT":
      return { label: "Deuda", icon: CreditCard, color: "text-red-500", bg: "bg-red-500" }
    default:
      return { label: "Otro", icon: PiggyBank, color: "text-gray-500", bg: "bg-gray-500" }
  }
}

const EXCHANGE_RATE = 6.96

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await accountsService.getAccounts()
        setAccounts(data)
      } catch (error) {
        console.error("Failed to fetch accounts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  // Helper to get value in standard currency (BOB) for calculations
  const getValueInBOB = (account: Account) => {
    return account.currency === 'USD' ? account.balance * EXCHANGE_RATE : account.balance
  }

  // Helper to format currency
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'BOB',
      minimumFractionDigits: 2
    }).format(value)
  }

  // Calculate Total Assets Value in BOB (for percentages in Table)
  const totalGlobalAssetsInBOB = accounts
    .reduce((acc, account) => {
      if (account.type === 'DEBT') return acc
      return acc + getValueInBOB(account)
    }, 0)
    
  // Prepare table data (Mix of currencies, normalized to BOB for weight)
  const assetsDetail: AssetDetail[] = accounts.map(account => {
    const details = getAccountTypeDetails(account.type)
    const valueInBOB = getValueInBOB(account)
    
    const weight = account.type === 'DEBT' 
        ? 'N/A' 
        : `${((valueInBOB / totalGlobalAssetsInBOB) * 100).toFixed(1)}%`

    return {
      id: account.id || Math.random().toString(),
      name: account.name,
      category: details.label,
      weight: weight,
      formattedValue: formatCurrency(account.balance, account.currency),
      icon: details.icon,
      color: `${details.color} ${details.color.replace("text-", "bg-").replace("500", "100")}`,
    }
  })

  // Prepare Groups for AssetsSection (Separated by Currency)
  const currencies = Array.from(new Set(accounts.map(a => a.currency)))
  
  const currencyGroups: CurrencyGroup[] = currencies.map(currency => {
    const currencyAccounts = accounts.filter(a => a.currency === currency)
    
    // Total Wealth for this currency (Assets - Debts)
    const totalWealth = currencyAccounts.reduce((acc, account) => {
      if (account.type === 'DEBT') return acc - account.balance
      return acc + account.balance
    }, 0)

    // Baseline for percentages (Sum of Assets only)
    const totalAssets = currencyAccounts.reduce((acc, account) => {
        if (account.type === 'DEBT') return acc
        return acc + account.balance
    }, 0)

    // Group by Type within this currency
    const assetsByType = currencyAccounts.reduce((acc, account) => {
        if (account.type === 'DEBT') return acc
        
        const existing = acc.find(a => a.type === account.type)
        if (existing) {
          existing.value += account.balance
        } else {
          acc.push({ type: account.type, value: account.balance })
        }
        return acc
    }, [] as { type: AccountType; value: number }[])

    const assets = assetsByType.map(item => {
        const details = getAccountTypeDetails(item.type)
        return {
          name: details.label,
          value: item.value,
          color: details.bg,
          percent: Math.round((item.value / totalAssets) * 100) || 0
        }
    }).sort((a, b) => b.value - a.value)

    return {
        currency,
        totalWealth,
        formattedTotal: formatCurrency(totalWealth, currency),
        assets
    }
  })

  if (loading) {
    return <AppLayout><div>Cargando...</div></AppLayout>
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        
        {/* Top Section: Net Worth & Cashflow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wealth Summary takes 1 column: Passes multiple groups */}
          <AssetsSection groups={currencyGroups} />
          
          {/* Cashflow Sankey takes 2 columns */}
          <CashflowSection />
        </div>

        {/* Bottom Section: Assets Details */}
        <div className="grid grid-cols-1 gap-6">
           <AssetsTable assets={assetsDetail} />
        </div>

      </div>
    </AppLayout>
  )
}
