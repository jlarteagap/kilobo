"use client"

import { useEffect, useState } from "react"
import { Transaction } from "@/types/transaction"
import { ArrowDownLeft, ArrowUpRight, Repeat, ArrowRightLeft, PiggyBank } from "lucide-react"

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()
  }, [])

  async function loadTransactions() {
    try {
      setLoading(true)
      // TODO: Implement local storage or API call
      setTransactions([])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-4">Cargando transacciones...</div>
  if (error) return <div className="text-red-500 py-4">{error}</div>
  if (transactions.length === 0) return <div className="text-center py-4 text-gray-500">No hay transacciones registradas.</div>

  const getIcon = (type: string) => {
    switch (type) {
      case 'INCOME': return <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
      case 'EXPENSE': return <ArrowUpRight className="w-5 h-5 text-rose-600" />
      case 'TRANSFER': return <ArrowRightLeft className="w-5 h-5 text-blue-600" />
      case 'SAVING': return <PiggyBank className="w-5 h-5 text-purple-600" />
      default: return null
    }
  }

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'INCOME': return 'text-emerald-600'
      case 'EXPENSE': return 'text-rose-600'
      case 'TRANSFER': return 'text-blue-600'
      case 'SAVING': return 'text-purple-600'
      default: return 'text-gray-900'
    }
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
                    {tx.category?.name || (tx.type === 'TRANSFER' ? 'Transferencia' : 'Sin categoría')}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {tx.description}
                {tx.is_recurring && <Repeat className="inline w-3 h-3 ml-1 text-gray-400" />}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {tx.account?.name}
                {tx.to_account && (
                  <span className="text-gray-400 mx-1">→ {tx.to_account.name}</span>
                )}
              </td>
              <td className={`px-4 py-3 text-right font-medium ${getAmountColor(tx.type)}`}>
                {tx.type === 'EXPENSE' || tx.type === 'SAVING' ? '-' : '+'}
                {new Intl.NumberFormat('es-BO', { style: 'currency', currency: tx.currency }).format(tx.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
