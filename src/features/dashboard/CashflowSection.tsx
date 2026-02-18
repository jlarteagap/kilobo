"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, Sankey, Tooltip } from "recharts"

import { useTransactions } from "@/features/transactions/hooks/useTransactions"
import { useCategories } from "@/features/categories/hooks/useCategories"
import { useAccounts } from "@/features/accounts/hooks/useAccounts"

import { Loader2 } from "lucide-react"

import { SankeyCustomNode } from "./components/SankeyCustomNode"
import { useCashflowData } from "./hooks/useCashflowData"

const formatBOB = (value: number) =>
  new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
  }).format(value)


export function CashflowSection() {
  const { data: transactions = [], isLoading: loadingTransactions } = useTransactions()
  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts()
  
  const isLoading = loadingTransactions || loadingCategories || loadingAccounts

  const { sankeyData, isEmpty } = useCashflowData({
    transactions,
    categories,
    accounts,
    isLoading,
  })

  if (isLoading) {
    return (
      <Card className="col-span-2 h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </Card>
    )
  }

  if (isEmpty) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-gray-800">Flujo de Caja Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-gray-400">
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
              data={sankeyData}
              nodeWidth={12}
              nodePadding={50}
              margin={{ left: 20, right: 120, top: 20, bottom: 20 }}
              link={{ stroke: "#10B981", strokeOpacity: 0.2 }}
              node={<SankeyCustomNode />}
            >
              <Tooltip formatter={(value: number) => formatBOB(value)} />
            </Sankey>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
