"use client"

import { Transaction } from "@/types/transaction"
import { Account } from "@/types/account"
import { Category } from "@/types/category"
import { Repeat } from "lucide-react"
import {
  getTransactionIcon,
  getTransactionAmountColor,
  getTransactionSign,
  getAccountName,
  getAccountColor,
  getCategoryDisplay,
  formatTransactionDate,
  normalizeCurrency,
} from "@/features/transactions/utils/transaction-display.utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"

interface TransactionListProps {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  loading?: boolean
}

export function TransactionList({
  transactions,
  accounts,
  categories,
  loading = false,
}: TransactionListProps) {
  if (loading) {
    return <div className="text-center py-4 text-gray-500">Cargando transacciones...</div>
  }

  if (transactions.length === 0) {
    return <div className="text-center py-4 text-gray-500">No hay transacciones registradas.</div>
  }

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
          {transactions.map((tx) => {
            const Icon = getTransactionIcon(tx.type)
            const category = getCategoryDisplay(tx.category_id, categories)

            return (
              <tr key={tx.id} className="hover:bg-gray-50/50">
                {/* Fecha */}
                <td className="px-4 py-3 text-gray-500">
                  {formatTransactionDate(tx.date)}
                </td>

                {/* Categoría */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {Icon && (
                      <span className="p-1.5 rounded-full bg-gray-100">
                        <Icon className={`w-5 h-5 ${getTransactionAmountColor(tx.type)}`} />
                      </span>
                    )}
                    <span className="font-medium text-gray-700">
                      {category.name
                        ? category.parent
                          ? <>{category.parent}<span className="text-gray-400 mx-1">→ {category.name}</span></>
                          : category.name
                        : tx.type === "TRANSFER" ? "Transferencia" : "Sin categoría"
                      }
                    </span>
                  </div>
                </td>

                {/* Descripción */}
                <td className="px-4 py-3 text-gray-600">
                  {tx.description}
                  {tx.is_recurring && (
                    <Repeat className="inline w-3 h-3 ml-1 text-gray-400" />
                  )}
                </td>

                {/* Cuenta */}
                <td className={`px-4 py-3 ${getAccountColor(tx.account_id, accounts)}`}>
                  {getAccountName(tx.account_id, accounts)}
                  {tx.to_account_id && (
                    <span className="text-gray-400 mx-1">
                      →{" "}
                      <span className={getAccountColor(tx.to_account_id, accounts)}>
                        {getAccountName(tx.to_account_id, accounts)}
                      </span>
                    </span>
                  )}
                </td>

                {/* Monto */}
                <td className={`px-4 py-3 text-right font-medium ${getTransactionAmountColor(tx.type)}`}>
                  {getTransactionSign(tx.type)}
                  {formatCurrency(tx.amount, normalizeCurrency(tx.currency))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
