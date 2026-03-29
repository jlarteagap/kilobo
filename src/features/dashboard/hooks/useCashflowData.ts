// features/cashflow/hooks/useCashflowData.ts
import { useMemo } from "react"
import { filterByPeriod } from "@/utils/date.utils"
import { convertToBOB }   from "@/lib/config/exchange-rates"
import type { Transaction } from "@/types/transaction"
import type { Category }    from "@/types/category"
import type { Account }     from "@/types/account"
import type { Project }     from "@/types/project"
import type { Period }      from "@/types/period"

type SankeyNode = {
  name:   string
  type?:  "income" | "expense" | "account" | "balance" | "project" | "subtype"
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
  project: '#8B5CF6',
  subtype: '#F59E0B',
}

function buildSankeyData(
  transactions: Transaction[],
  categories:   Category[],
  accounts:     Account[],
  projects:     Project[],
  period:       Period
): SankeyData {
  const filtered = filterByPeriod(transactions, period)

  const nodeMap = new Map<string, number>()
  const nodes:   SankeyNode[] = []

  const getNodeIndex = (key: string, name: string, type?: SankeyNode['type'], color?: string): number => {
    if (!nodeMap.has(key)) {
      nodeMap.set(key, nodes.length)
      nodes.push({
        name,
        type,
        color: color ?? (type ? NODE_COLORS[type] : '#3B82F6'),
      })
    }
    return nodeMap.get(key)!
  }

  const links: SankeyLink[] = []

  const upsertLink = (source: number, target: number, value: number) => {
    if (value <= 0 || source === target) return
    const existing = links.find((l) => l.source === source && l.target === target)
    if (existing) {
      existing.value += value
    } else {
      links.push({ source, target, value })
    }
  }

  const accountFlows = new Map<string, { in: number; out: number }>(
    accounts.map((a) => [a.id, { in: 0, out: 0 }])
  )

  filtered.forEach((t) => {
    const amountBOB = convertToBOB(t.amount, t.currency)
    const acc       = accounts.find((a) => a.id === t.account_id)
    if (!acc || amountBOB <= 0) return
    if (t.type === 'TRANSFER' || t.type === 'SAVING') return

    const flow    = accountFlows.get(acc.id) ?? { in: 0, out: 0 }
    const accIdx  = getNodeIndex(`account::${acc.id}`, acc.name, 'account')
    const project = t.project_id ? projects.find((p) => p.id === t.project_id) : null

    if (t.type === 'INCOME') {
      flow.in += amountBOB
      accountFlows.set(acc.id, flow)

      if (project) {
        // Proyecto como fuente de ingreso — nodo izquierdo
        const label  = `${project.icon ?? ''} ${project.name}`.trim()
        const srcIdx = getNodeIndex(`income-project::${project.id}`, label, 'income', project.color)
        upsertLink(srcIdx, accIdx, amountBOB)
      } else {
        const cat = categories.find((c) => c.id === t.category_id)
        if (!cat) return
        const srcIdx = getNodeIndex(`income-cat::${cat.id}`, cat.name, 'income')
        upsertLink(srcIdx, accIdx, amountBOB)
      }

    } else if (t.type === 'EXPENSE') {
      flow.out += amountBOB
      accountFlows.set(acc.id, flow)

      if (project) {
        // Proyecto como destino de gasto — nodo derecho
        const label  = `${project.icon ?? ''} ${project.name}`.trim()
        const dstIdx = getNodeIndex(`expense-project::${project.id}`, label, 'expense', project.color)
        upsertLink(accIdx, dstIdx, amountBOB)
      } else {
        const cat = categories.find((c) => c.id === t.category_id)
        if (!cat) return
        const dstIdx = getNodeIndex(`expense-cat::${cat.id}`, cat.name, 'expense')
        upsertLink(accIdx, dstIdx, amountBOB)
      }
    }
  })

  // Ahorro o déficit por cuenta
  accountFlows.forEach((flow, accountId) => {
    const acc = accounts.find((a) => a.id === accountId)
    if (!acc || (flow.in === 0 && flow.out === 0)) return

    const diff   = flow.in - flow.out
    const accIdx = getNodeIndex(`account::${acc.id}`, acc.name, 'account')

    if (diff > 0) {
      const idx = getNodeIndex('balance::saving', 'Ahorro/Excedente', 'balance')
      upsertLink(accIdx, idx, diff)
    } else if (diff < 0) {
      const idx = getNodeIndex('balance::prev', 'Fondos Previos', 'balance')
      upsertLink(idx, accIdx, Math.abs(diff))
    }
  })

  return { nodes, links }
}

interface UseCashflowDataProps {
  transactions: Transaction[]
  categories:   Category[]
  accounts:     Account[]
  projects:     Project[]     // ← NUEVO
  isLoading:    boolean
  period:       Period
}

export function useCashflowData({
  transactions,
  categories,
  accounts,
  projects,                   // ← NUEVO
  isLoading,
  period,
}: UseCashflowDataProps) {
  const sankeyData = useMemo(() => {
    if (isLoading) return { nodes: [], links: [] }
    return buildSankeyData(transactions, categories, accounts, projects, period)
  }, [transactions, categories, accounts, projects, isLoading, period])

  const isEmpty = sankeyData.nodes.length === 0 || sankeyData.links.length === 0

  return { sankeyData, isEmpty }
}