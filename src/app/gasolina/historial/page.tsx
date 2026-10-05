import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { TimelineCard } from "../components/TimelineCard"
import { getClosedCyclesAction } from "../actions"
import { getMaintenanceLogsAction } from "../maintenance.actions"

export const metadata = {
  title: "Historial del auto | Kilo",
  description: "Cargas de gasolina y mantenimiento en orden",
}

export const dynamic = 'force-dynamic';

export default async function HistorialPage() {
  const [closedCycles, maintenanceLogs] = await Promise.all([
    getClosedCyclesAction(),
    getMaintenanceLogsAction(),
  ])

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/gasolina"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="size-3" />
          Volver a Gasolina
        </Link>

        <header className="mt-4 mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Historial del auto
          </h1>
          <p className="text-xs font-medium text-zinc-500 mt-1">
            Cada carga junto a los servicios que la rodean
          </p>
        </header>

        <TimelineCard cycles={closedCycles} logs={maintenanceLogs} />
      </div>
    </div>
  )
}