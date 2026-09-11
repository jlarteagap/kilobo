// ─── Tipos de cambio en vivo ─────────────────────────────────────────────────
// USD/BOB: dolarapi.com (binance). Cripto/BOB: CoinGecko (1h de caché).
// Fallback: BOB no se convierte (rate 1), el resto usa el rate USD.

let _usdRate = 6.96 // fallback inicial
let _lastUsdFetched = 0
const _cryptoRates: Record<string, number> = {}
let _cryptoFetched = 0

const USD_TTL = 5 * 60 * 1000 // 5 min
const CRYPTO_TTL = 60 * 60 * 1000 // 1 h

/** símbolo de moneda → id de CoinGecko */
export const CRYPTO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  XRP: 'ripple',
}

export function setUSDRate(rate: number) {
  _usdRate = rate
  _lastUsdFetched = Date.now()
}

export function getUSDRate(): number {
  return _usdRate
}

export function getExchangeRate(currency: string): number {
  if (currency === 'BOB') return 1
  // Stablecoins pegged a USD (1 USDT ≈ 1 USD)
  if (currency === 'USD' || currency === 'USDT' || currency === 'USDC') return _usdRate
  return _cryptoRates[currency] ?? _usdRate
}

export function convertToBOB(amount: number, currency: string): number {
  return amount * getExchangeRate(currency)
}

/**
 * Actualiza USD y cripto solo si su caché está vencida.
 * Nunca lanza: ante cualquier fallo se conserva el rate actual.
 */
export async function refreshRates(): Promise<void> {
  const usdStale = Date.now() - _lastUsdFetched >= USD_TTL
  const cryptoStale = Date.now() - _cryptoFetched >= CRYPTO_TTL

  if (usdStale) {
    try {
      const res = await fetch('https://bo.dolarapi.com/v1/dolares/binance')
      if (res.ok) {
        const data = await res.json()
        if (data.venta && typeof data.venta === 'number' && data.venta > 0) {
          setUSDRate(data.venta)
        }
      }
    } catch {
      // Silencio — se mantiene el rate actual
    }
  }

  if (cryptoStale && Object.keys(CRYPTO_IDS).length > 0) {
    try {
      const ids = Object.values(CRYPTO_IDS).join(',')
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=bob`
      )
      if (res.ok) {
        const data = await res.json()
        for (const [symbol, id] of Object.entries(CRYPTO_IDS)) {
          const bob = data?.[id]?.bob
          if (typeof bob === 'number' && bob > 0) _cryptoRates[symbol] = bob
        }
        _cryptoFetched = Date.now()
      }
    } catch {
      // Silencio — se mantienen los rates actuales
    }
  }
}