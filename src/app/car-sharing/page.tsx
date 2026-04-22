import { CarSharingDashboard } from "./components/CarSharingDashboard"
import { getActiveCycleAction, getClosedCyclesAction } from "./actions"

export const metadata = {
  title: "Gasolina | Kilo",
  description: "Registro de gastos compartidos de vehículo",
}

export const dynamic = 'force-dynamic';

export default async function CarSharingPage() {
  const activeCycle = await getActiveCycleAction()
  const closedCycles = await getClosedCyclesAction()

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden relative">
      {/* Decorative background element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-50/50 dark:bg-emerald-950/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <header className="mb-16 text-center">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm ring-1 ring-emerald-100 dark:ring-emerald-800/50">
            <span className="text-2xl">🚗</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-neutral-950 dark:text-white mb-4">
            División de <span className="font-medium text-emerald-600 dark:text-emerald-400">Gasolina</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-md mx-auto leading-relaxed">
            Un registro honesto y preciso para el uso compartido del vehículo.
          </p>
        </header>

        <CarSharingDashboard 
          activeCycle={activeCycle} 
          closedCycles={closedCycles} 
        />
      </div>
    </div>
  )
}
