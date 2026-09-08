// features/accounts/utils/daily-period.utils.ts
// Límite del periodo diario: las 4:00 AM en hora local.
// Los cambios registrados después de la medianoche pero antes de las 4:00 pertenecen
// al día que cierra (quedan capturados en la ancla del nuevo periodo).

export function startOfDailyPeriod(now: Date = new Date()): Date {
  const boundary = new Date(now)
  boundary.setHours(4, 0, 0, 0)
  if (boundary > now) boundary.setDate(boundary.getDate() - 1)
  return boundary
}