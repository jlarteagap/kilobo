"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/accounts/utils/account-display.utils"
import { INSTALLMENT_STATUS_CONFIG } from "@/types/credit"
import type { Installment } from "@/types/credit"

interface InstallmentsTableProps {
  installments: Installment[]
  currency: string
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export function InstallmentsTable({
  installments,
  currency,
  selectedIds,
  onSelectionChange,
}: InstallmentsTableProps) {
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('asc')

  const sorted = [...installments].sort((a, b) => {
    const diff = a.number - b.number
    return sortBy === 'asc' ? diff : -diff
  })

  const toggleSelect = (id: string) => {
    const installment = installments.find((i) => i.id === id)
    if (!installment || installment.status === 'PAID') return
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((sid) => sid !== id)
        : [...selectedIds, id]
    )
  }

  const selectAll = () => {
    const selectable = sorted.filter((i) => i.status !== 'PAID')
    const allSelected = selectable.every((i) => selectedIds.includes(i.id))
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !selectable.find((i) => i.id === id)))
    } else {
      onSelectionChange([...new Set([...selectedIds, ...selectable.map((i) => i.id)])])
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="w-10 px-3 py-3 text-left">
              <input
                type="checkbox"
                checked={
                  sorted.filter((i) => i.status !== 'PAID').length > 0 &&
                  sorted.filter((i) => i.status !== 'PAID').every((i) => selectedIds.includes(i.id))
                }
                onChange={selectAll}
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900/20 cursor-pointer"
              />
            </th>
            <th
              className="px-3 py-3 text-left font-medium text-gray-400 cursor-pointer select-none"
              onClick={() => setSortBy(sortBy === 'asc' ? 'desc' : 'asc')}
            >
              # {sortBy === 'asc' ? '↑' : '↓'}
            </th>
            <th className="px-3 py-3 text-left font-medium text-gray-400">Vence</th>
            <th className="px-3 py-3 text-right font-medium text-gray-400">Total</th>
            <th className="px-3 py-3 text-right font-medium text-gray-400 hidden sm:table-cell">Capital</th>
            <th className="px-3 py-3 text-right font-medium text-gray-400 hidden sm:table-cell">Interés</th>
            <th className="px-3 py-3 text-right font-medium text-gray-400 hidden md:table-cell">Saldo</th>
            <th className="px-3 py-3 text-center font-medium text-gray-400">Estado</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((inst, idx) => {
            const statusConfig = INSTALLMENT_STATUS_CONFIG[inst.status]
            const isPaid       = inst.status === 'PAID'
            const isOverdue    = inst.status === 'OVERDUE'
            const isSelected   = selectedIds.includes(inst.id)

            return (
              <tr
                key={inst.id}
                className={cn(
                  'border-b border-gray-50 transition-colors',
                  isPaid ? 'text-gray-400' : 'hover:bg-gray-50/50',
                  isOverdue && 'bg-rose-50/30',
                  isSelected && 'bg-emerald-50/30'
                )}
              >
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isPaid}
                    onChange={() => toggleSelect(inst.id)}
                    className={cn(
                      'rounded border-gray-300 text-gray-900 focus:ring-gray-900/20',
                      isPaid && 'opacity-30 cursor-not-allowed'
                    )}
                  />
                </td>
                <td className="px-3 py-2.5 font-semibold text-gray-900">
                  {inst.number}
                </td>
                <td className="px-3 py-2.5 text-gray-600">
                  {new Date(inst.due_date).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </td>
                <td className={cn(
                  'px-3 py-2.5 text-right font-semibold',
                  isPaid ? 'text-gray-400' : 'text-gray-900'
                )}>
                  {formatCurrency(inst.total_amount, currency)}
                </td>
                <td className="px-3 py-2.5 text-right hidden sm:table-cell text-gray-600">
                  {formatCurrency(inst.principal, currency)}
                </td>
                <td className="px-3 py-2.5 text-right hidden sm:table-cell text-gray-600">
                  {formatCurrency(inst.interest, currency)}
                </td>
                <td className="px-3 py-2.5 text-right hidden md:table-cell text-gray-600">
                  {formatCurrency(inst.remaining_balance, currency)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                    statusConfig.color,
                    statusConfig.bg
                  )}>
                    {statusConfig.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
