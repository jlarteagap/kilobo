import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { CarSharingDashboard } from "./components/CarSharingDashboard"
import { MaintenanceWidgets } from "./components/MaintenanceWidgets"
import { getActiveCycleAction, getClosedCyclesAction } from "./actions"
import { getAbsoluteOdometerAction, getMaintenanceLogsAction } from "./maintenance.actions"

export const metadata = {
  title: "Gasolina | Kilo",
  description: "Registro de gastos compartidos de vehículo",
}

export const dynamic = 'force-dynamic';

export default async function CarSharingPage() {
  const [activeCycle, closedCycles, absoluteOdometer, maintenanceLogs] = await Promise.all([
    getActiveCycleAction(),
    getClosedCyclesAction(),
    getAbsoluteOdometerAction(),
    getMaintenanceLogsAction(),
  ])

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Gasolina
          </h1>
          <p className="text-xs font-medium text-zinc-500 mt-1">
            Gastos compartidos y mantenimiento del vehículo
          </p>
          <Link
            href="/gasolina/historial"
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Ver historial
            <ArrowRight className="size-3" />
          </Link>
        </header>

        <div className="space-y-6 mb-6">
          <MaintenanceWidgets
            absoluteOdometer={absoluteOdometer}
            logs={maintenanceLogs}
          />
        </div>

        <CarSharingDashboard
          activeCycle={activeCycle}
          closedCycles={closedCycles}
        />
      </div>
    </div>
  )
}