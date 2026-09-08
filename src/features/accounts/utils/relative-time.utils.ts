// features/accounts/utils/relative-time.utils.ts
// Referencia temporal relativa legible en es-ES para el badge de variación diaria.

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const YEAR = 365 * DAY

// Devuelve una referencia compacta y legible: "ahora", "hace 5 min", "hace 2 h",
// "ayer", "hace N días", "hace N meses" o "hace N años".
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diff = now.getTime() - date.getTime()

  if (diff < MINUTE) return 'ahora'

  if (diff < HOUR) {
    const minutes = Math.max(1, Math.round(diff / MINUTE))
    return `hace ${minutes} min`
  }

  if (diff < DAY) {
    const hours = Math.round(diff / HOUR)
    return `hace ${hours} h`
  }

  if (diff < 2 * DAY) return 'ayer'

  const rtf = new Intl.RelativeTimeFormat('es-ES', { numeric: 'auto' })

  if (diff < 30 * DAY) {
    const days = Math.round(diff / DAY)
    return `hace ${days} días`
  }

  if (diff < YEAR) {
    const months = Math.min(11, Math.max(1, Math.round(diff / MONTH)))
    return rtf.format(-months, 'month')
  }

  const years = Math.max(1, Math.round(diff / YEAR))
  return rtf.format(-years, 'year')
}