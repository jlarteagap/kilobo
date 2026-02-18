// Futura mejora: reemplazar por llamada a API de tipo de cambio
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 6.96,
  BOB: 1,
}

export const getExchangeRate = (currency: string): number => {
  return EXCHANGE_RATES[currency] ?? 1
}

export const convertToBOB = (amount: number, currency: string): number => {
  return amount * getExchangeRate(currency)
}