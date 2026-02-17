
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
import { LucideIcon } from "lucide-react"

export interface AssetDetail {
  id: string
  name: string
  category: string
  weight: string
  formattedValue: string
  icon: LucideIcon
  color: string
}

interface AssetsTableProps {
  assets: AssetDetail[]
}

export function AssetsTable({ assets }: AssetsTableProps) {
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
            {assets.map((asset) => (
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
                  {asset.formattedValue}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
