import { Wallet, SplitSquareHorizontal, EyeOff } from 'lucide-react'

const CARD_SHADOW = { boxShadow: '0 2px 16px rgba(0,0,0,0.05)' } as const

export function BentoGrid() {
  return (
    <section className="bg-[#F2FBE0] pb-24 sm:pb-32">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Visibilidad Total (Wide) */}
          <div className="md:col-span-2 rounded-[22px] bg-white p-8 flex flex-col transition-shadow duration-300 hover:shadow-md"
            style={CARD_SHADOW}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-[#F2F9E3] text-[#4F6A35]">
                <SplitSquareHorizontal className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Visibilidad Total</h3>
            </div>
            <p className="text-[#6E6E73] text-sm mb-8 max-w-md">
              Compara ingresos y gastos con barras de progresión precisas. Sin gráficos redundantes, solo la verdad sobre tu flujo de caja.
            </p>
            {/* Fake UI Element */}
            <div className="mt-auto space-y-4 rounded-xl bg-[#F2F9E3]/40 p-4 border border-[rgba(0,0,0,0.06)]">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">Ingresos</span>
                  <span className="text-foreground font-semibold">$5,200.00</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[rgba(0,0,0,0.06)]">
                  <div className="h-2 rounded-full bg-[#4F6A35] w-[80%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">Gastos</span>
                  <span className="text-foreground font-semibold">$3,100.00</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[rgba(0,0,0,0.06)]">
                  <div className="h-2 rounded-full bg-[#C08A2E] w-[45%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Activos & Pasivos (Square) */}
          <div className="md:col-span-1 rounded-[22px] bg-white p-8 flex flex-col transition-shadow duration-300 hover:shadow-md"
            style={CARD_SHADOW}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-[#F2F9E3] text-[#4F6A35]">
                <Wallet className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Activos & Pasivos</h3>
            </div>
            <p className="text-[#6E6E73] text-sm mb-8">
              Un registro contable inmutable para cada una de tus cuentas y deudas.
            </p>
            <div className="mt-auto space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-[rgba(0,0,0,0.06)]">
                <span className="text-xs font-medium text-[#6E6E73]">Caja de Ahorro</span>
                <span className="text-xs font-semibold text-[#4F6A35]">+$2,400.00</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[rgba(0,0,0,0.06)]">
                <span className="text-xs font-medium text-[#6E6E73]">Tarjeta de Crédito</span>
                <span className="text-xs font-semibold text-[#B5543D]">-$850.00</span>
              </div>
            </div>
          </div>

          {/* Card 3: Sin Ruido (Wide or side-by-side depending on content) */}
          <div className="md:col-span-3 rounded-[22px] bg-white p-8 flex flex-col md:flex-row items-center gap-8 transition-shadow duration-300 hover:shadow-md"
            style={CARD_SHADOW}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-[#F2F9E3] text-[#4F6A35]">
                  <EyeOff className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Sin Ruido</h3>
              </div>
              <p className="text-[#6E6E73] text-sm max-w-xl">
                Diseñado como una herramienta profesional, no como un juguete. Colores semánticos que significan algo. Jerarquía clara. Un espacio tranquilo para tomar decisiones financieras serias.
              </p>
            </div>
            <div className="flex-shrink-0 w-full md:w-64 rounded-xl border border-[rgba(0,0,0,0.06)] overflow-hidden bg-[#F2F9E3]/40">
              <div className="px-4 py-3 bg-white border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Mercado</span>
                <span className="text-xs text-[#6E6E73]">12/Oct</span>
              </div>
              <div className="px-4 py-3 bg-white flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Suscripción</span>
                <span className="text-xs text-[#6E6E73]">15/Oct</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}