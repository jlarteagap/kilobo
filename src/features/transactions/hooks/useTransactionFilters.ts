// features/transactions/hooks/useTransactionFilters.ts
import { useState, useMemo } from 'react'
import { filterByPeriod, resolvePeriod } from '@/utils/date.utils'
import { format } from 'date-fns'

const ymd = (d: Date) => format(d, 'yyyy-MM-dd')
import { convertToBOB } from '@/lib/config/exchange-rates'
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
  projectId:   string | null
  tag:         string | null
  type:        TransactionTypeFilter
}

export const DEFAULT_FILTERS: TransactionFilters = {
  period:     DEFAULT_PERIOD,
  accountId:  null,
  categoryId: null,
  tag:        null,
  type:       'ALL',
  projectId:  null,
}

// ─── Conteo de filtros activos — para el badge ────────────────────────────────
export function countActiveFilters(filters: TransactionFilters): number {
  let count = 0
  if (filters.accountId)  count++
  if (filters.categoryId) count++
  if (filters.tag)        count++
  if (filters.type !== 'ALL') count++
  if (filters.projectId)  count++
  // El período no cuenta — siempre hay uno activo
  return count
}

// ─── Estado de filtros ────────────────────────────────────────────────────────
/**
 * Estado y setters, sin depender de los datos.
 *
 * Va separado de la derivación porque el periodo se necesita ANTES de pedir
 * los datos — es lo que acota la consulta en el servidor. Si el estado viviera
 * dentro del hook que recibe las transacciones, no habría forma de usarlo para
 * construir la petición.
 */
export function useTransactionFilterState() {
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS)

  // ── Setters individuales ────────────────────────────────────────────────────
  const setPeriod     = (period: Period)                  => setFilters((f) => ({ ...f, period     }))
  const setAccountId  = (accountId:  string | null)       => setFilters((f) => ({ ...f, accountId  }))
  const setCategoryId = (categoryId: string | null)       => setFilters((f) => ({ ...f, categoryId }))
  const setProjectId  = (projectId:  string | null)       => setFilters((f) => ({ ...f, projectId  }))
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
    projectId:  null,
  }))

  return {
    filters,
    setPeriod,
    setAccountId,
    setCategoryId,
    setProjectId,
    setTag,
    setType,
    resetFilters,
    resetSecondaryFilters,
  }
}

/** Convierte el estado de filtros en los parámetros que acepta la API. */
export function toServerFilters(filters: TransactionFilters) {
  const { from, to } = resolvePeriod(filters.period)
  return { from: ymd(from), to: ymd(to) }
}

// ─── Derivación sobre los datos ya cargados ───────────────────────────────────
/**
 * Aplica los filtros secundarios sobre los datos que el servidor ya devolvió
 * acotados por periodo.
 *
 * Los secundarios siguen en el cliente a propósito: el filtro por cuenta
 * también incluye las transferencias donde la cuenta es el DESTINO
 * (`to_account_id`), algo que una igualdad en Firestore no expresa. Bajar eso
 * al servidor cambiaría el comportamiento visible.
 */
export function useTransactionFilters(
  transactions: Transaction[],
  filters: TransactionFilters,
) {
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

    if (filters.projectId) {
      // null == gasto personal (sin proyecto asignado)
      result = filters.projectId === '__personal__'
        ? result.filter((t) => !t.project_id)
        : result.filter((t) => t.project_id === filters.projectId)
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



  // ── Estadísticas rápidas de los filtrados ──────────────────────────────────
  const stats = useMemo(() => {
    const income  = filtered
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + convertToBOB(t.amount, t.currency), 0)

    const expense = filtered
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + convertToBOB(t.amount, t.currency), 0)

    return {
      total:   filtered.length,
      income,
      expense,
      net:     income - expense,
    }
  }, [filtered])

  const activeFilterCount = countActiveFilters(filters)

  return {
    filters,
    filtered,
    activeFilterCount,
    availableTags,
    stats,
  }
}