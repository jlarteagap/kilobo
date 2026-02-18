"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, Sankey, Tooltip, Layer, Rectangle } from "recharts"
import { useTransactions } from "@/features/transactions/hooks/useTransactions"
import { useCategories } from "@/features/categories/hooks/useCategories"
import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { Transaction } from "@/types/transaction"
import { Category } from "@/types/category"
import { Account } from "@/types/account"
import { Loader2 } from "lucide-react"

const EXCHANGE_RATE = 6.96

type SankeyNode = {
  name: string
  type?: 'income' | 'expense' | 'account' | 'balance'
}

type SankeyLink = {
  source: number
  target: number
  value: number
}

type SankeyData = {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

// Custom Node Component
const MyCustomNode = (props: any) => {
  const { x, y, width, height, index, payload, containerWidth } = props
  const isOut = x + width + 6 > containerWidth
  
  // Define colors based on node type or name
  let fill = "#8884d8"
  if (payload.name === "Ahorro/Excedente") fill = "#10B981" // emerald-500
  else if (payload.name === "Fondos Previos") fill = "#6B7280" // gray-500
  else if (payload.color) fill = payload.color // Use passed color if available
  else fill = "#3B82F6" // Default blue

  return (
    <Layer key={`node-${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity="1"
      />
      
      {/* Label inside or outside based on width */}
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontSize="12"
        fill="#fff"
        className="font-medium pointer-events-none"
        style={{ display: width < 60 ? 'none' : 'block' }} 
      >
         {/* Only show inside if wide enough */}
      </text>

       <text
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isOut ? 'end' : 'start'}
        alignmentBaseline="middle"
        fill="#374151"
        fontSize="12"
        fontWeight="500"
      >
        {payload.name}
      </text>
    </Layer>
  )
}

export function CashflowSection() {
  const [data, setData] = useState<SankeyData>({ nodes: [], links: [] })
  
  const { data: transactions = [], isLoading: loadingTransactions } = useTransactions()
  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts()
  
  const loading = loadingTransactions || loadingCategories || loadingAccounts

  useEffect(() => {
    if (!loading) {
      processData(transactions, categories, accounts)
    }
  }, [transactions, categories, accounts, loading])

  const processData = (transactions: Transaction[], categories: Category[], accounts: Account[]) => {
    // 1. Filter for Current Month
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyTransactions = transactions.filter(t => {
        const d = new Date(t.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    // Helper: Normalize to BOB
    const getAmountInBOB = (amount: number, currency: string) => {
        return currency === 'USD' ? amount * EXCHANGE_RATE : amount
    }

    // Nodes Maps
    const nodeMap = new Map<string, number>()
    const nodes: SankeyNode[] = []
    let nodeCounter = 0

    const getNodeIndex = (name: string, type?: SankeyNode['type']) => {
        if (!nodeMap.has(name)) {
            nodeMap.set(name, nodeCounter)
            let color = "#3B82F6" // Default Blue (Accounts)
            if (type === 'income') color = "#10B981" // Emerald
            if (type === 'expense') color = "#EF4444" // Red
            if (name === "Ahorro/Excedente") color = "#10B981"
            if (name === "Fondos Previos") color = "#6B7280"
            
            nodes.push({ name, type, color } as any) // Cast to any to include color in payload
            nodeCounter++
        }
        return nodeMap.get(name)!
    }

    const links: SankeyLink[] = []

    // Tracking Account Flow
    const accountFlows = new Map<string, { in: number, out: number }>()
    accounts.forEach(a => accountFlows.set(a.id || '', { in: 0, out: 0 }))

    // Process Transactions
    monthlyTransactions.forEach(t => {
        const amountBOB = getAmountInBOB(t.amount, t.currency)
        
        if (t.type === 'INCOME' && t.category_id && t.account_id) {
            const cat = categories.find(c => c.id === t.category_id)
            const acc = accounts.find(a => a.id === t.account_id)
            
            if (cat && acc) {
                const sourceIdx = getNodeIndex(cat.name, 'income')
                const targetIdx = getNodeIndex(acc.name, 'account')

                // Update Account In-flow
                const flow = accountFlows.get(acc.id!) || { in: 0, out: 0 }
                flow.in += amountBOB
                accountFlows.set(acc.id!, flow)

                // Add Link
                const existingLink = links.find(l => l.source === sourceIdx && l.target === targetIdx)
                if (existingLink) {
                    existingLink.value += amountBOB
                } else {
                    links.push({ source: sourceIdx, target: targetIdx, value: amountBOB })
                }
            }
        } else if (t.type === 'EXPENSE' && t.category_id && t.account_id) {
            const cat = categories.find(c => c.id === t.category_id)
            const acc = accounts.find(a => a.id === t.account_id)

            if (cat && acc) {
                const sourceIdx = getNodeIndex(acc.name, 'account')
                const targetIdx = getNodeIndex(cat.name, 'expense')

                // Update Account Out-flow
                const flow = accountFlows.get(acc.id!) || { in: 0, out: 0 }
                flow.out += amountBOB
                accountFlows.set(acc.id!, flow)

                 // Add Link
                 const existingLink = links.find(l => l.source === sourceIdx && l.target === targetIdx)
                 if (existingLink) {
                     existingLink.value += amountBOB
                 } else {
                     links.push({ source: sourceIdx, target: targetIdx, value: amountBOB })
                 }
            }
        }
        // TODO: Handle Transfers if needed
    })

    // Process Balances (Savings vs Previous Funds)
    accountFlows.forEach((flow, accountId) => {
        const acc = accounts.find(a => a.id === accountId)
        if (!acc) return
        
        // Skip accounts with no activity in this view
        if (flow.in === 0 && flow.out === 0) return 

        const diff = flow.in - flow.out
        const accIdx = getNodeIndex(acc.name, 'account')

        if (diff > 0) {
            // Surplus -> Savings
            const targetIdx = getNodeIndex("Ahorro/Excedente", 'balance')
            links.push({ source: accIdx, target: targetIdx, value: diff })
        } else if (diff < 0) {
            // Deficit -> From Previous Funds
            const sourceIdx = getNodeIndex("Fondos Previos", 'balance')
            // Add to Existing Funds -> Account
            links.push({ source: sourceIdx, target: accIdx, value: Math.abs(diff) })
        }
    })

    setData({ nodes, links })
  }

  if (loading) {
    return (
        <Card className="col-span-2 h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </Card>
    )
  }

  // Handle Empty State
  if (data.nodes.length === 0 || data.links.length === 0) {
      return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle className="text-gray-800">Flujo de Caja Mensual</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full flex items-center justify-center text-gray-400">
                    No hay transacciones este mes.
                </div>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-gray-800">Flujo de Caja Mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <Sankey
                  data={data}
                  nodeWidth={12}
                  nodePadding={50}
                  margin={{
                      left: 20,
                      right: 120, 
                      top: 20,
                      bottom: 20,
                  }}
                  link={{ stroke: '#10B981', strokeOpacity: 0.2 }}
                  node={<MyCustomNode />}
                >
                    <Tooltip 
                        formatter={(value: number) => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(value)}
                    />
                </Sankey>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
