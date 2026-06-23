// providers/ExchangeRateProvider.tsx
'use client'

import { useEffect } from 'react'
import { setUSDRate } from '@/lib/config/exchange-rates'

const REFRESH_INTERVAL = 10 * 60 * 1000 // 10 minutos

/**
 * Inicializa y mantiene actualizado el tipo de cambio USD → BOB
 * en el módulo exchange-rates.ts (módulo global, no React).
 * Se monta una vez en el layout raíz.
 */
export function ExchangeRateProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('/api/exchange-rate')
        if (!res.ok) return
        const data = await res.json()
        if (data.USD && typeof data.USD === 'number') {
          setUSDRate(data.USD)
        }
      } catch {
        // Silencio — se usa el rate actual (fallback 6.96 o el último válido)
      }
    }

    // Fetch inicial
    fetchRate()

    // Refresco periódico
    const interval = setInterval(fetchRate, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  return <>{children}</>
}
