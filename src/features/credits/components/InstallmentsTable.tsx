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
    <div className="overflow-x-auto rounded-xl border border-[rgba(0,0,0,0.06)]">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-[#F2F9E3]/40 border-b border-[rgba(0,0,0,0.06)]">
            <th className="w-10 px-3 py-3 text-left">
              <input
                type="checkbox"
                checked={
                  sorted.filter((i) => i.status !== 'PAID').length > 0 &&
                  sorted.filter((i) => i.status !== 'PAID').every((i) => selectedIds.includes(i.id))
                }
                onChange={selectAll}
                className="rounded border-[rgba(0,0,0,0.16)] text-foreground focus:ring-[#5F7D42]/30 cursor-pointer"
              />
            </th>
            <th
              className="px-3 py-3 text-left font-medium text-[#6E6E73] cursor-pointer select-none"
              onClick={() => setSortBy(sortBy === 'asc' ? 'desc' : 'asc')}
            >
              # {sortBy === 'asc' ? '↑' : '↓'}
            </th>
            <th className="px-3 py-3 text-left font-medium text-[#6E6E73]">Vence</th>
            <th className="px-3 py-3 text-right font-medium text-[#6E6E73]">Total</th>
            <th className="px-3 py-3 text-right font-medium text-[#6E6E73] hidden sm:table-cell">Capital</th>
            <th className="px-3 py-3 text-right font-medium text-[#6E6E73] hidden sm:table-cell">Interés</th>
            <th className="px-3 py-3 text-right font-medium text-[#6E6E73] hidden md:table-cell">Saldo</th>
            <th className="px-3 py-3 text-center font-medium text-[#6E6E73]">Estado</th>
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
                  'border-b border-[rgba(0,0,0,0.06)] transition-colors',
                  isPaid ? 'text-[#6E6E73]' : 'hover:bg-[#F2F9E3]/40',
                  isOverdue && 'bg-[#FAEDE9]/30',
                  isSelected && 'bg-[#F2F9E3]/30'
                )}
              >
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isPaid}
                    onChange={() => toggleSelect(inst.id)}
                    className={cn(
                      'rounded border-[rgba(0,0,0,0.16)] text-foreground focus:ring-[#5F7D42]/30',
                      isPaid && 'opacity-30 cursor-not-allowed'
                    )}
                  />
                </td>
                <td className="px-3 py-2.5 font-semibold text-foreground">
                  {inst.number}
                </td>
                <td className="px-3 py-2.5 text-foreground">
                  {new Date(inst.due_date).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </td>
                <td className={cn(
                  'px-3 py-2.5 text-right font-semibold',
                  isPaid ? 'text-[#6E6E73]' : 'text-foreground'
                )}>
                  {formatCurrency(inst.total_amount, currency)}
                </td>
                <td className="px-3 py-2.5 text-right hidden sm:table-cell text-foreground">
                  {formatCurrency(inst.principal, currency)}
                </td>
                <td className="px-3 py-2.5 text-right hidden sm:table-cell text-foreground">
                  {formatCurrency(inst.interest, currency)}
                </td>
                <td className="px-3 py-2.5 text-right hidden md:table-cell text-foreground">
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
