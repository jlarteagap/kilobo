'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useUserPreferences, useUpdatePreferences } from '@/features/settings/hooks/usePreferences'
import { Skeleton } from '@/components/ui/skeleton'
import { Coins, Info } from 'lucide-react'

const CURRENCY_OPTIONS = [
  { value: 'BOB', label: 'Boliviano (Bs)', code: 'BOB' },
  { value: 'USD', label: 'Dólar estadounidense (US$)', code: 'USD' },
] as const

export default function AjustesPage() {
  const { data: preferences, isLoading } = useUserPreferences()
  const updatePreferences = useUpdatePreferences()

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ajustes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personaliza cómo se muestran tus finanzas.
          </p>
        </div>

        {/* Moneda base */}
        <div
          className="bg-white rounded-[22px] p-6 flex flex-col gap-4"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-[-0.01em]">
                Moneda base
              </h2>
              <p className="text-[12px] text-[#6E6E73] mt-0.5 leading-relaxed">
                Define la moneda para los totales globales de tus cuentas,
                inversiones y patrimonio.
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4 text-[#6E6E73]" />
            </div>
          </div>

          {isLoading || !preferences ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CURRENCY_OPTIONS.map((option) => {
                const selected = preferences.displayCurrency === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (!selected) updatePreferences.mutate({ displayCurrency: option.value })
                    }}
                    disabled={updatePreferences.isPending}
                    className={[
                      'flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200',
                      selected
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                        : 'border-[rgba(0,0,0,0.08)] bg-white hover:border-zinc-500/50',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0',
                        selected ? 'bg-white/15' : 'bg-zinc-100',
                      ].join(' ')}
                    >
                      {option.code}
                    </span>
                    <span>
                      <span className={['block text-[13px] font-semibold', selected ? 'text-white' : 'text-foreground'].join(' ')}>
                        {option.label}
                      </span>
                      <span className={['block text-[11px]', selected ? 'text-white/70' : 'text-[#6E6E73]'].join(' ')}>
                        {selected ? 'En uso' : 'Seleccionar'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Nota cripto */}
        <div className="flex items-start gap-3 rounded-[22px] bg-zinc-50 px-5 py-4">
          <Info className="w-4 h-4 text-[#6E6E73] mt-0.5 shrink-0" />
          <p className="text-[12px] text-[#6E6E73] leading-relaxed">
            Los tipos de cambio de BTC, ETH, BNB y XRP se obtienen en vivo
            (CoinGecko, caché de 1 hora). USDT y USDC se tratan como pegadas al dólar.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}