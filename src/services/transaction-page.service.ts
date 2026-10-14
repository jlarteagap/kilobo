import { transactionsRepository } from '@/repositories/transactions.repository'
import { encodeCursor, decodeCursor } from '@/lib/cursor'
import { refreshRates, convertToBOB } from '@/lib/config/exchange-rates'
import type { Transaction } from '@/types/transaction'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

export interface PageResult {
  items: Transaction[]
  nextCursor: string | null
}

/**
 * Listado paginado de transacciones.
 *
 * Reemplaza al listado completo. El cambio de contrato es deliberado y ruidoso
 * a propósito: la respuesta incluye `nextCursor`, de modo que un consumidor que
 * asuma que el array está completo ve que falta información en lugar de calcular
 * totales sobre datos truncados sin avisar.
 */
export const transactionPageService = {
  async getPage(
    userId: string,
    opts: {
      cursor?: string
      limit?: string
      from?: string
      to?: string
      accountId?: string
      categoryId?: string
      projectId?: string
      tag?: string
      type?: string
    },
  ): Promise<PageResult> {
    const limit = clampLimit(opts.limit)
    const decoded = opts.cursor ? decodeCursor(userId, opts.cursor) : null

    // Un cursor manipulado no puede devolver una posición arbitraria: si no
    // valida la firma se ignora y se empieza por la primera página.
    const cursor = decoded ?? null

    const { items, nextCursor } = await transactionsRepository.findPage(userId, limit, cursor, {
      from: opts.from,
      to: opts.to,
      accountId: opts.accountId,
      categoryId: opts.categoryId,
      projectId: opts.projectId,
      tag: opts.tag,
      type: opts.type,
    })

    return {
      items,
      nextCursor: nextCursor ? encodeCursor(userId, nextCursor) : null,
    }
  },
}

/**
 * Totales del conjunto filtrado.
 *
 * Los totales NO se derivan de la página cargada: eso daría cifras calculadas
 * sobre un subconjunto, que es el modo de fallo silencioso que esta migración
 * quiere evitar. Se recalculan en el servidor sobre el conjunto que los filtros
 * describen.
 *
 * El coste es acotado por los filtros que el usuario eligió. Filtrar "todo el
 * historial" cuesta el historial, pero es una acción deliberada, no un peaje
 * automático en cada carga.
 */
export async function getFilteredTotals(
  userId: string,
  filters: Record<string, string | undefined>,
): Promise<{ total: number; income: number; expense: number; net: number }> {
  await refreshRates()

  const all = await transactionsRepository.findByFilters(userId, filters)

  let income = 0
  let expense = 0
  for (const t of all) {
    if (t.status !== 'COMPLETED') continue
    const v = convertToBOB(t.amount, t.currency)
    if (t.type === 'INCOME') income += v
    else if (t.type === 'EXPENSE') expense += v
  }

  return { total: all.length, income, expense, net: income - expense }
}

function clampLimit(raw: string | undefined): number {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1) return DEFAULT_LIMIT
  return Math.min(n, MAX_LIMIT)
}