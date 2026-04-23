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
      
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <header className="mb-20 text-center space-y-6">
          <div className="inline-flex flex-col items-center">
            <div className="size-16 rounded-[2rem] bg-neutral-950 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
              <span className="text-3xl">🚗</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-5xl md:text-6xl font-light tracking-tighter text-neutral-950 dark:text-white">
                Kilo <span className="text-emerald-500 font-medium italic">Sharing</span>
              </h1>
              <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full" />
            </div>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-lg mx-auto leading-relaxed font-light">
            Gestión inteligente y transparente de gastos compartidos para tu vehículo.
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
