"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Home, Bitcoin } from "lucide-react"

const assetsDetail = [
  {
    id: 1,
    name: "Cuenta de Ahorros",
    category: "Efectivo",
    weight: "15%",
    value: 25000,
    icon: DollarSign,
    color: "text-emerald-500 bg-emerald-100",
  },
  {
    id: 2,
    name: "S&P 500 ETF",
    category: "Inversiones",
    weight: "40%",
    value: 62000,
    icon: TrendingUp,
    color: "text-blue-500 bg-blue-100",
  },
  {
    id: 3,
    name: "Bitcoin",
    category: "Cripto",
    weight: "15%",
    value: 23000,
    icon: Bitcoin,
    color: "text-orange-500 bg-orange-100",
  },
  {
    id: 4,
    name: "Apartamento Centro",
    category: "Propiedades",
    weight: "30%",
    value: 45000,
    icon: Home,
    color: "text-indigo-500 bg-indigo-100",
  },
]

export function AssetsTable() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="text-gray-800">Detalle de Activos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assetsDetail.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${asset.color}`}>
                      <asset.icon className="h-4 w-4" />
                    </div>
                    {asset.name}
                  </div>
                </TableCell>
                <TableCell>{asset.category}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    {asset.weight}
                  </span>
                </TableCell>
                <TableCell className="text-right font-bold">
                  ${asset.value.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
