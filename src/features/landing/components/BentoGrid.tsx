import { Wallet, SplitSquareHorizontal, EyeOff } from 'lucide-react'

export function BentoGrid() {
  return (
    <section className="bg-neutral-50 pb-24 sm:pb-32">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Visibilidad Total (Wide) */}
          <div className="md:col-span-2 rounded-2xl bg-white border border-neutral-200 p-8 shadow-sm flex flex-col hover:border-neutral-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                <SplitSquareHorizontal className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Visibilidad Total</h3>
            </div>
            <p className="text-neutral-500 text-sm mb-8 max-w-md">
              Compara ingresos y gastos con barras de progresión precisas. Sin gráficos redundantes, solo la verdad sobre tu flujo de caja.
            </p>
            {/* Fake UI Element */}
            <div className="mt-auto space-y-4 rounded-xl bg-neutral-50 p-4 border border-neutral-100">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-neutral-700">Ingresos</span>
                  <span className="text-neutral-900 font-semibold">$5,200.00</span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-200">
                  <div className="h-2 rounded-full bg-emerald-500 w-[80%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-neutral-700">Gastos</span>
                  <span className="text-neutral-900 font-semibold">$3,100.00</span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-200">
                  <div className="h-2 rounded-full bg-amber-500 w-[45%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Activos & Pasivos (Square) */}
          <div className="md:col-span-1 rounded-2xl bg-white border border-neutral-200 p-8 shadow-sm flex flex-col hover:border-neutral-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                <Wallet className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Activos & Pasivos</h3>
            </div>
            <p className="text-neutral-500 text-sm mb-8">
              Un registro contable inmutable para cada una de tus cuentas y deudas.
            </p>
            <div className="mt-auto space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                <span className="text-xs font-medium text-neutral-600">Caja de Ahorro</span>
                <span className="text-xs font-semibold text-emerald-600">+$2,400.00</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                <span className="text-xs font-medium text-neutral-600">Tarjeta de Crédito</span>
                <span className="text-xs font-semibold text-rose-600">-$850.00</span>
              </div>
            </div>
          </div>

          {/* Card 3: Sin Ruido (Wide or side-by-side depending on content) */}
          <div className="md:col-span-3 rounded-2xl bg-white border border-neutral-200 p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 hover:border-neutral-300 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                  <EyeOff className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Sin Ruido</h3>
              </div>
              <p className="text-neutral-500 text-sm max-w-xl">
                Diseñado como una herramienta profesional, no como un juguete. Colores semánticos que significan algo. Jerarquía clara. Un espacio tranquilo para tomar decisiones financieras serias.
              </p>
            </div>
            <div className="flex-shrink-0 w-full md:w-64 rounded-xl border border-neutral-100 shadow-sm overflow-hidden bg-neutral-50">
              <div className="px-4 py-3 bg-white border-b border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-900">Mercado</span>
                <span className="text-xs text-neutral-400">12/Oct</span>
              </div>
              <div className="px-4 py-3 bg-white flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-900">Suscripción</span>
                <span className="text-xs text-neutral-400">15/Oct</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
