"use client"

import { useEffect, useState } from "react"
import { Transaction } from "@/types/transaction"
import { Account } from "@/types/account"
import { Category } from "@/types/category"
import { ArrowDownLeft, ArrowUpRight, Repeat, ArrowRightLeft, PiggyBank, CreditCard } from "lucide-react"
import { accountsService } from "@/services/accounts.service"
import { categoryService } from "@/services/category.service"


export interface TransactionListProps {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  loading?: boolean
  refreshData?: () => void
}

export function TransactionList({ transactions, accounts, categories, loading = false }: TransactionListProps) {

  const getAccountName = (accountId: string | null): string => {
    if (!accountId) return ''
    const account = accounts.find(acc => acc.id === accountId)
    return account?.name || accountId
  }

  const getAccountType = (accountId: string | null): string | null => {
    if (!accountId) return null
    const account = accounts.find(acc => acc.id === accountId)
    return account?.type || null
  }

  const getAccountColor = (accountId: string | null): string => {
    const accountType = getAccountType(accountId)
    return accountType === 'DEBT' ? 'text-orange-600 font-semibold' : 'text-gray-600'
  }

const getCategoryName = (categoryId: string | null): React.ReactNode => {
  if (!categoryId) return ''
  const category = categories.find(cat => cat.id === categoryId)
  if (!category) return categoryId
  
  // Si la categoría tiene un padre, mostrar: Padre → Subcategoría
  if (category.parent_id) {
    const parentCategory = categories.find(cat => cat.id === category.parent_id)
    if (parentCategory) {
      return (
        <>
          {parentCategory.name}
          <span className="text-gray-400 mx-1"> → 
          {category.name}</span>
        </>
      )
    }
  }
  
  return category.name
}

  if (loading) return <div className="text-center py-4">Cargando transacciones...</div>
  if (transactions.length === 0) return <div className="text-center py-4 text-gray-500">No hay transacciones registradas.</div>

  const getIcon = (type: string) => {
    switch (type) {
      case 'INCOME': return <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
      case 'EXPENSE': return <ArrowUpRight className="w-5 h-5 text-rose-600" />
      case 'TRANSFER': return <ArrowRightLeft className="w-5 h-5 text-blue-600" />
      case 'SAVING': return <PiggyBank className="w-5 h-5 text-purple-600" />
      case 'DEBT': return <CreditCard className="w-5 h-5 text-orange-600" />
      default: return null
    }
  }

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'INCOME': return 'text-emerald-600'
      case 'EXPENSE': return 'text-rose-600'
      case 'TRANSFER': return 'text-blue-600'
      case 'SAVING': return 'text-purple-600'
      case 'DEBT': return 'text-orange-600'
      default: return 'text-gray-900'
    }
  }

  // Normalizar códigos de moneda legacy (BS -> BOB)
  const normalizeCurrency = (currency: string) => {
    return currency === 'BS' ? 'BOB' : currency
  }

  console.log(transactions)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 font-medium">Descripción</th>
            <th className="px-4 py-3 font-medium">Cuenta</th>
            <th className="px-4 py-3 font-medium text-right">Monto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 text-gray-500">
                {new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(tx.date))}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-full bg-gray-100`}>
                    {getIcon(tx.type)}
                  </span>
                  <span className="font-medium text-gray-700">
                    {getCategoryName(tx.category_id) || (tx.type === 'TRANSFER' ? 'Transferencia' : 'Sin categoría')}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {tx.description}
                {tx.is_recurring && <Repeat className="inline w-3 h-3 ml-1 text-gray-400" />}
              </td>
              <td className={`px-4 py-3 ${getAccountColor(tx.account_id)}`}>
                {getAccountName(tx.account_id)}
                {tx.to_account_id && (
                  <span className="text-gray-400 mx-1">→ <span className={getAccountColor(tx.to_account_id)}>{getAccountName(tx.to_account_id)}</span></span>
                )}
              </td>
              <td className={`px-4 py-3 text-right font-medium ${getAmountColor(tx.type)}`}>
                {tx.type === 'EXPENSE' || tx.type === 'SAVING' || tx.type === 'DEBT' ? '-' : '+'}
                {new Intl.NumberFormat('es-BO', { style: 'currency', currency: normalizeCurrency(tx.currency) }).format(tx.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
