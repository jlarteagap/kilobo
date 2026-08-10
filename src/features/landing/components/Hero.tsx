'use client'

import { TrendingUp } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F2FBE0] pt-24 pb-32 sm:pt-32 sm:pb-40">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Conoce tu patrimonio real.
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#6E6E73] max-w-2xl mx-auto">
            Gestiona tus activos, pasivos y flujos de caja en un único centro de mando diseñado para el largo plazo. Sin ruido, con total precisión.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/login"
              className="rounded-xl bg-[#4F6A35] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#3C5230] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F6A35] transition-all"
            >
              Comenzar Gratis
            </a>
          </div>
        </div>

        {/* The Signature Pulse Widget */}
        <div className="mx-auto mt-16 max-w-md sm:mt-24">
          <div className="relative rounded-[22px] bg-white p-6 overflow-hidden group hover:shadow-md transition-shadow duration-300"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
          >
            {/* Subtle background sparkline indication */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F2F9E3]/50 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#6E6E73]">Patrimonio Neto</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F2F9E3] px-2 py-1 text-xs font-medium text-[#4F6A35] ring-1 ring-inset ring-[#4F6A35]/20">
                  <TrendingUp className="size-3" />
                  +3.2% este mes
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight text-[#4F6A35]">
                  $124,500.00
                </span>
                <span className="text-sm text-[#6E6E73]">USD</span>
              </div>
              <div className="mt-4 h-1 w-full rounded-full bg-[rgba(0,0,0,0.06)] overflow-hidden">
                <div className="h-full rounded-full bg-[#4F6A35] w-3/4 transition-all duration-1000 ease-out" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
