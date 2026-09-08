// features/accounts/utils/relative-time.utils.ts
// Referencia temporal relativa legible en es-ES para el badge de último cambio.

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// Devuelve una referencia compacta y legible: "ahora", "hace 5 min", "hace 2 h",
// "ayer", "hace N días" o la fecha corta si es anterior a 7 días.
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

  if (diff < 7 * DAY) {
    const days = Math.round(diff / DAY)
    return `hace ${days} días`
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}