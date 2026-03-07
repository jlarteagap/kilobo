// app/(dashboard)/page.tsx
"use client"

import AppLayout from "@/components/layout/AppLayout"
import dynamic from "next/dynamic"
import { CashflowSectionSkeleton } from "@/features/dashboard/components/skeletons/CashflowSectionSkeleton"

const CashflowSection = dynamic(
  () => import("@/features/dashboard/CashflowSection").then(m => m.CashflowSection),
  { ssr: false, loading: () => <CashflowSectionSkeleton /> }
)

import { AssetsSection }    from "@/features/dashboard/AssetsSection"
import { AssetsTable }      from "@/features/dashboard/AssetsTable"
import { DashboardSkeleton } from "@/features/dashboard/components/skeletons/DashboardSkeleton"
import { useAccounts }           from "@/features/accounts/hooks/useAccounts"
import { useAccountsDashboard }  from "@/features/accounts/hooks/useAccountsDashboard"

export default function DashboardPage() {
  const { data: accounts = [], isLoading, isError } = useAccounts()

  const {
    assetsDetail,
    currencyGroups,
    totalAssetsFormatted,
    totalLiabilitiesFormatted,
    netWorthFormatted,
    netWorthPositive,
  } = useAccountsDashboard(accounts)

  if (isLoading) {
    return <AppLayout><DashboardSkeleton /></AppLayout>
  }

  if (isError) {
    return (
      <AppLayout>
        <div className="bg-rose-50 text-rose-500 text-sm p-4 rounded-xl">
          Error al cargar los datos del dashboard.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-10 container mx-auto max-w-7xl py-12 px-6">

        {/* ── Header ── */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Gestión de Patrimonio
          </h1>
          <p className="text-sm font-medium text-muted-foreground/70">
            Vista consolidada de activos, pasivos y flujos de capital.
          </p>
        </div>

        {/* ── Fila 1: Patrimonio (1/3) + Flujo de caja (2/3) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <AssetsSection groups={currencyGroups} />
          </div>
          <div className="md:col-span-2">
            <CashflowSection />
          </div>
        </div>

        {/* ── Fila 2: Balance patrimonial — ancho completo ── */}
        <AssetsTable
          assets={assetsDetail}
          totalAssetsFormatted={totalAssetsFormatted}
          totalLiabilitiesFormatted={totalLiabilitiesFormatted}
          netWorthFormatted={netWorthFormatted}
          netWorthPositive={netWorthPositive}
        />

      </div>
    </AppLayout>
  )
}