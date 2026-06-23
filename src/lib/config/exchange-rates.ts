// ─── Tipo de cambio en vivo ──────────────────────────────────────────────────
// Se actualiza desde la API de dolarapi.com vía /api/exchange-rate
// Valor por defecto mientras se carga — se sobreescribe con el rate real

let _usdRate = 6.96 // fallback inicial

export function setUSDRate(rate: number) {
  _usdRate = rate
}

export function getUSDRate(): number {
  return _usdRate
}

export function getExchangeRate(currency: string): number {
  if (currency === 'BOB') return 1
  return _usdRate
}

export function convertToBOB(amount: number, currency: string): number {
  return amount * getExchangeRate(currency)
}