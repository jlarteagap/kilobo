"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Fragment } from "react"
import { Separator } from "@/components/ui/separator"

export interface AssetSummary {
  name: string
  value: number
  color: string
  percent: number
}

export interface CurrencyGroup {
  currency: string
  totalWealth: number
  assets: AssetSummary[]
  formattedTotal: string
}

interface AssetsSectionProps {
  groups: CurrencyGroup[]
}

export function AssetsSection({ groups }: AssetsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-800">Patrimonio Neto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {groups.map((group, index) => (
          <Fragment key={group.currency}>
            {index > 0 && <Separator className="my-6" />}
            
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  {group.currency === 'BOB' ? 'Bolivianos' : group.currency === 'USD' ? 'Dólares' : group.currency}
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  {group.formattedTotal}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
                  {group.assets.map((asset) => (
                    <div
                      key={asset.name}
                      className={asset.color}
                      style={{ width: `${asset.percent}%` }}
                      title={`${asset.name}: ${asset.percent}%`}
                    />
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-4">
                  {group.assets.map((asset) => (
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
            </div>
          </Fragment>
        ))}
      </CardContent>
    </Card>
  )
}
