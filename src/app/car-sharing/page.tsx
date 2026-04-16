import { CarSharingDashboard } from "./components/CarSharingDashboard"
import { getTripsAction, getConfigAction } from "./actions"

export const metadata = {
  title: "Gasolina | Kilo",
  description: "Registro de gastos compartidos de vehículo",
}

export const dynamic = 'force-dynamic';

export default async function CarSharingPage() {
  const trips = await getTripsAction()
  const config = await getConfigAction()

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <span className="text-4xl">🚗</span> División de Gasolina
          </h1>
          <p className="text-neutral-500 mt-2 text-lg">
            Registra el kilometraje diario y calcula la cuota proporcional de forma automática.
          </p>
        </header>

        <CarSharingDashboard initialTrips={trips} initialGasAmount={config.gasAmount} />
      </div>
    </div>
  )
}
