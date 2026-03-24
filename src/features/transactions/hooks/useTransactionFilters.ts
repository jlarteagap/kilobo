// features/transactions/hooks/useTransactionFilters.ts
import { useState, useMemo } from 'react'
import { filterByPeriod } from '@/utils/date.utils'
import { DEFAULT_PERIOD } from '@/types/period'
import type { Period } from '@/types/period'
import type { Transaction } from '@/types/transaction'

// ─── Tipos de filtro ──────────────────────────────────────────────────────────
export type TransactionTypeFilter =
  | 'ALL'
  | 'INCOME'
  | 'EXPENSE'
  | 'TRANSFER'
  | 'SAVING'

export interface TransactionFilters {
  period:      Period
  accountId:   string | null
  categoryId:  string | null
  tag:         string | null
  type:        TransactionTypeFilter
}

export const DEFAULT_FILTERS: TransactionFilters = {
  period:     DEFAULT_PERIOD,
  accountId:  null,
  categoryId: null,
  tag:        null,
  type:       'ALL',
}

// ─── Conteo de filtros activos — para el badge ────────────────────────────────
export function countActiveFilters(filters: TransactionFilters): number {
  let count = 0
  if (filters.accountId)  count++
  if (filters.categoryId) count++
  if (filters.tag)        count++
  if (filters.type !== 'ALL') count++
  // El período no cuenta — siempre hay uno activo
  return count
}

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useTransactionFilters(transactions: Transaction[]) {
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS)

  // ── Setters individuales ────────────────────────────────────────────────────
  const setPeriod     = (period: Period)                  => setFilters((f) => ({ ...f, period     }))
  const setAccountId  = (accountId:  string | null)       => setFilters((f) => ({ ...f, accountId  }))
  const setCategoryId = (categoryId: string | null)       => setFilters((f) => ({ ...f, categoryId }))
  const setTag        = (tag: string | null)              => setFilters((f) => ({ ...f, tag        }))
  const setType       = (type: TransactionTypeFilter)     => setFilters((f) => ({ ...f, type       }))

  // ── Reset ───────────────────────────────────────────────────────────────────
  const resetFilters = () => setFilters(DEFAULT_FILTERS)

  const resetSecondaryFilters = () => setFilters((f) => ({
    ...f,
    accountId:  null,
    categoryId: null,
    tag:        null,
    type:       'ALL',
  }))

  // ── Transacciones filtradas ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    // 1. Filtrar por período
    let result = filterByPeriod(transactions, filters.period)

    // 2. Filtrar por tipo
    if (filters.type !== 'ALL') {
      result = result.filter((t) => t.type === filters.type)
    }

    // 3. Filtrar por cuenta
    if (filters.accountId) {
      result = result.filter((t) =>
        t.account_id    === filters.accountId ||
        t.to_account_id === filters.accountId  // incluir transferencias destino
      )
    }

    // 4. Filtrar por categoría
    if (filters.categoryId) {
      result = result.filter((t) => t.category_id === filters.categoryId)
    }

    // 5. Filtrar por tag
    if (filters.tag) {
      result = result.filter((t) => t.tag === filters.tag)
    }

    return result
  }, [transactions, filters])

  // ── Tags disponibles según filtros actuales ────────────────────────────────
  // Solo muestra tags que existen en las transacciones ya filtradas por período/cuenta/categoría
  const availableTags = useMemo(() => {
    let base = filterByPeriod(transactions, filters.period)

    if (filters.type !== 'ALL') {
      base = base.filter((t) => t.type === filters.type)
    }
    if (filters.accountId) {
      base = base.filter((t) =>
        t.account_id === filters.accountId ||
        t.to_account_id === filters.accountId
      )
    }
    if (filters.categoryId) {
      base = base.filter((t) => t.category_id === filters.categoryId)
    }

    const tags = Array.from(
      new Set(base.map((t) => t.tag).filter(Boolean) as string[])
    ).sort()

    return tags
  }, [transactions, filters.period, filters.type, filters.accountId, filters.categoryId])

  // ── Categorías disponibles según filtros actuales ──────────────────────────
  const availableCategoryIds = useMemo(() => {
    let base = filterByPeriod(transactions, filters.period)

    if (filters.type !== 'ALL') {
      base = base.filter((t) => t.type === filters.type)
    }
    if (filters.accountId) {
      base = base.filter((t) =>
        t.account_id === filters.accountId ||
        t.to_account_id === filters.accountId
      )
    }

    return Array.from(new Set(base.map((t) => t.category_id).filter(Boolean) as string[]))
  }, [transactions, filters.period, filters.type, filters.accountId])

  // ── Estadísticas rápidas de los filtrados ──────────────────────────────────
  const stats = useMemo(() => {
    const income  = filtered
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = filtered
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      total:   filtered.length,
      income,
      expense,
      net:     income - expense,
    }
  }, [filtered])

  const activeFilterCount = countActiveFilters(filters)

  return {
    // Estado
    filters,
    filtered,
    activeFilterCount,
    availableTags,
    availableCategoryIds,
    stats,

    // Setters
    setPeriod,
    setAccountId,
    setCategoryId,
    setTag,
    setType,
    resetFilters,
    resetSecondaryFilters,
  }
}