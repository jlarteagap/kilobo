
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
import { AssetDetail } from "@/types/account"
import { Badge } from "@/components/ui/badge"

interface AssetsTableProps {
  assets: AssetDetail[]
}

export function AssetsTable({ assets }: AssetsTableProps) {
  if (assets.length === 0) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle className="text-gray-800">Detalle de Activos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-gray-400">
            No hay activos registrados.
          </div>
        </CardContent>
      </Card>
    )
  }
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
                  <Badge variant="outline">{asset.weight}</Badge>
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
