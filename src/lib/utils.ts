import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// utils/date.utils.ts — crear este helper compartido
export function parseLocalDate(dateStr: string): Date {
  // "2026-02-22" → new Date(2026, 1, 22) — sin conversión de timezone
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}