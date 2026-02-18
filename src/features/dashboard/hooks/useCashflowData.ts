import { useMemo } from "react"
import { Transaction } from "@/types/transaction"
import { Category } from "@/types/category"
import { Account } from "@/types/account"
import { convertToBOB } from "@/lib/config/exchange-rates"

type SankeyNode = {
  name: string
  type?: "income" | "expense" | "account" | "balance"
  color?: string
}

type SankeyLink = {
  source: number
  target: number
  value: number
}

export type SankeyData = {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

const NODE_COLORS: Record<string, string> = {
  income: "#10B981",
  expense: "#EF4444",
  account: "#3B82F6",
  balance: "#6B7280",
}

function buildSankeyData(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[]
): SankeyData {
  // 1. Filtrar transacciones del mes actual
  const now = new Date()
  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.date)
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    )
  })

  // 2. Helpers para construir nodos
  const nodeMap = new Map<string, number>()
  const nodes: SankeyNode[] = []

  const getNodeIndex = (name: string, type?: SankeyNode["type"]): number => {
    if (!nodeMap.has(name)) {
      nodeMap.set(name, nodes.length)
      nodes.push({
        name,
        type,
        color: type ? NODE_COLORS[type] : "#3B82F6",
      })
    }
    return nodeMap.get(name)!
  }

  // 3. Helper para acumular links sin duplicados
  const links: SankeyLink[] = []

  const upsertLink = (source: number, target: number, value: number) => {
    const existing = links.find(
      (l) => l.source === source && l.target === target
    )
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
  monthlyTransactions.forEach((t) => {
    const amountBOB = convertToBOB(t.amount, t.currency)
    const cat = categories.find((c) => c.id === t.category_id)
    const acc = accounts.find((a) => a.id === t.account_id)

    if (!cat || !acc) return

    if (t.type === "INCOME") {
      const sourceIdx = getNodeIndex(cat.name, "income")
      const targetIdx = getNodeIndex(acc.name, "account")

      const flow = accountFlows.get(acc.id) ?? { in: 0, out: 0 }
      flow.in += amountBOB
      accountFlows.set(acc.id, flow)

      upsertLink(sourceIdx, targetIdx, amountBOB)
    } else if (t.type === "EXPENSE") {
      const sourceIdx = getNodeIndex(acc.name, "account")
      const targetIdx = getNodeIndex(cat.name, "expense")

      const flow = accountFlows.get(acc.id) ?? { in: 0, out: 0 }
      flow.out += amountBOB
      accountFlows.set(acc.id, flow)

      upsertLink(sourceIdx, targetIdx, amountBOB)
    }
  })

  // 6. Calcular ahorro o déficit por cuenta
  accountFlows.forEach((flow, accountId) => {
    const acc = accounts.find((a) => a.id === accountId)
    if (!acc) return

    // Ignorar cuentas sin actividad este mes
    if (flow.in === 0 && flow.out === 0) return

    const diff = flow.in - flow.out
    const accIdx = getNodeIndex(acc.name, "account")

    if (diff > 0) {
      const targetIdx = getNodeIndex("Ahorro/Excedente", "balance")
      upsertLink(accIdx, targetIdx, diff)
    } else if (diff < 0) {
      const sourceIdx = getNodeIndex("Fondos Previos", "balance")
      upsertLink(sourceIdx, accIdx, Math.abs(diff))
    }
  })

  return { nodes, links }
}

// ─── Hook público ────────────────────────────────────────────────────────────

interface UseCashflowDataProps {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  isLoading: boolean
}

export function useCashflowData({
  transactions,
  categories,
  accounts,
  isLoading,
}: UseCashflowDataProps) {
  const sankeyData = useMemo(() => {
    if (isLoading) return { nodes: [], links: [] }
    return buildSankeyData(transactions, categories, accounts)
  }, [transactions, categories, accounts, isLoading])

  const isEmpty = sankeyData.nodes.length === 0 || sankeyData.links.length === 0

  return { sankeyData, isEmpty }
}