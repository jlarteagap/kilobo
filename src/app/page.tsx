"use client"

import AppLayout from "@/components/layout/AppLayout"
import { CashflowSection } from "@/features/dashboard/CashflowSection"
import { AssetsSection } from "@/features/dashboard/AssetsSection"
import { AssetsTable } from "@/features/dashboard/AssetsTable"

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        
        {/* Top Section: Net Worth & Cashflow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wealth Summary takes 1 column */}
          <AssetsSection />
          
          {/* Cashflow Sankey takes 2 columns */}
          <CashflowSection />
        </div>

        {/* Bottom Section: Assets Details */}
        <div className="grid grid-cols-1 gap-6">
           <AssetsTable />
        </div>

      </div>
    </AppLayout>
  )
}
