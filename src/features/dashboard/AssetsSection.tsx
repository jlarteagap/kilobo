"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Fragment } from "react"
import { Separator } from "@/components/ui/separator"

import { CurrencyGroup } from "@/types/account"

import { getCurrencyLabel } from "../accounts/utils/account-display.utils"

import { AssetBar } from "./components/AssetBar"
import { AssetLegend } from "./components/AssetLegend"

interface AssetsSectionProps {
  groups: CurrencyGroup[]
}

export function AssetsSection({ groups }: AssetsSectionProps) {
  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-800">Patrimonio Neto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-gray-400">
            No hay cuentas registradas.
          </div>
        </CardContent>
      </Card>
    )
  }
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
                  {getCurrencyLabel(group.currency)}
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  {group.formattedTotal}
                </span>
              </div>

              <div className="space-y-4">
                <AssetBar assets={group.assets} />
                <AssetLegend assets={group.assets} />
              </div>
            </div>
          </Fragment>
        ))}
      </CardContent>
    </Card>
  )
}
