// features/cashflow/hooks/useCashflowData.ts
import { useMemo } from "react"
import { filterByPeriod } from "@/utils/date.utils"
import { convertToBOB }   from "@/lib/config/exchange-rates"
import type { Transaction } from "@/types/transaction"
import type { Category }    from "@/types/category"
import type { Account }     from "@/types/account"
import type { Period }      from "@/types/period"

type SankeyNode = {
  name:   string
  type?:  "income" | "expense" | "account" | "balance"
  color?: string
}

type SankeyLink = {
  source: number
  target: number
  value:  number
}

export type SankeyData = {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

const NODE_COLORS: Record<string, string> = {
  income:  '#10B981',
  expense: '#EF4444',
  account: '#3B82F6',
  balance: '#6B7280',
}

function buildSankeyData(
  transactions: Transaction[],
  categories:   Category[],
  accounts:     Account[],
  period:       Period
): SankeyData {
  // 1. Filtrar por período usando el helper existente
  const filtered = filterByPeriod(transactions, period)

  // 2. Helpers para nodos
  const nodeMap = new Map<string, number>()
  const nodes:   SankeyNode[] = []

  const getNodeIndex = (name: string, type?: SankeyNode['type']): number => {
    if (!nodeMap.has(name)) {
      nodeMap.set(name, nodes.length)
      nodes.push({ name, type, color: type ? NODE_COLORS[type] : '#3B82F6' })
    }
    return nodeMap.get(name)!
  }

  // 3. Helper para links sin duplicados
  const links: SankeyLink[] = []

  const upsertLink = (source: number, target: number, value: number) => {
    const existing = links.find((l) => l.source === source && l.target === target)
    if (existing) {
      existing.value += value
    } else {
      links.push({ source, target, value })
    }
  }

  // 4. Tracking de flujos por cuenta
  const accountFlows = new Map<string, { in: number; out: number }>(
    accounts.map((a) => [a.id, { in: 0, out: 0 }])
  )

  // 5. Procesar transacciones
  filtered.forEach((t) => {
    const amountBOB = convertToBOB(t.amount, t.currency)
    const cat = categories.find((c) => c.id === t.category_id)
    const acc = accounts.find((a) => a.id === t.account_id)
    if (!cat || !acc) return

    if (t.type === 'INCOME') {
      const sourceIdx = getNodeIndex(cat.name, 'income')
      const targetIdx = getNodeIndex(acc.name, 'account')
      const flow = accountFlows.get(acc.id) ?? { in: 0, out: 0 }
      flow.in += amountBOB
      accountFlows.set(acc.id, flow)
      upsertLink(sourceIdx, targetIdx, amountBOB)
    } else if (t.type === 'EXPENSE') {
      const sourceIdx = getNodeIndex(acc.name, 'account')
      const targetIdx = getNodeIndex(cat.name, 'expense')
      const flow = accountFlows.get(acc.id) ?? { in: 0, out: 0 }
      flow.out += amountBOB
      accountFlows.set(acc.id, flow)
      upsertLink(sourceIdx, targetIdx, amountBOB)
    }
  })

  // 6. Calcular ahorro o déficit por cuenta
  accountFlows.forEach((flow, accountId) => {
    const acc = accounts.find((a) => a.id === accountId)
    if (!acc || (flow.in === 0 && flow.out === 0)) return

    const diff    = flow.in - flow.out
    const accIdx  = getNodeIndex(acc.name, 'account')

    if (diff > 0) {
      const targetIdx = getNodeIndex('Ahorro/Excedente', 'balance')
      upsertLink(accIdx, targetIdx, diff)
    } else if (diff < 0) {
      const sourceIdx = getNodeIndex('Fondos Previos', 'balance')
      upsertLink(sourceIdx, accIdx, Math.abs(diff))
    }
  })

  return { nodes, links }
}

interface UseCashflowDataProps {
  transactions: Transaction[]
  categories:   Category[]
  accounts:     Account[]
  isLoading:    boolean
  period:       Period          // ← nuevo
}

export function useCashflowData({
  transactions,
  categories,
  accounts,
  isLoading,
  period,                       // ← nuevo
}: UseCashflowDataProps) {
  const sankeyData = useMemo(() => {
    if (isLoading) return { nodes: [], links: [] }
    return buildSankeyData(transactions, categories, accounts, period)
  }, [transactions, categories, accounts, isLoading, period])

  const isEmpty = sankeyData.nodes.length === 0 || sankeyData.links.length === 0

  return { sankeyData, isEmpty }
}