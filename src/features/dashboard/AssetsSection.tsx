"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const assets = [
  { name: "Efectivo", value: 25000, color: "bg-emerald-500", percent: 15 },
  { name: "Inversiones", value: 85000, color: "bg-blue-500", percent: 55 },
  { name: "Propiedades", value: 45000, color: "bg-indigo-500", percent: 30 },
]

export function AssetsSection() {
  const totalWealth = assets.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-800">Patrimonio Neto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">
            ${totalWealth.toLocaleString()}
          </span>
          <span className="ml-2 text-sm text-green-600 font-medium">+12% vs mes anterior</span>
        </div>

        <div className="space-y-4">
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
            {assets.map((asset) => (
              <div
                key={asset.name}
                className={asset.color}
                style={{ width: `${asset.percent}%` }}
                title={`${asset.name}: ${asset.percent}%`}
              />
            ))}
          </div>
          
          <div className="flex flex-wrap gap-4">
            {assets.map((asset) => (
              <div key={asset.name} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${asset.color}`} />
                <span className="text-sm text-gray-600">{asset.name}</span>
                <span className="text-sm font-semibold text-gray-900">
                    {asset.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
