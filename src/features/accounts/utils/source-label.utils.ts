// features/accounts/utils/source-label.utils.ts
// Etiquetas legibles para el origen de un cambio de balance (historial).
import type { BalanceChangeSource } from "@/types/account"

const SOURCE_LABELS: Record<BalanceChangeSource, string> = {
  ACCOUNT: "Ajuste manual",
  TRANSACTION: "Transacción",
  INVESTMENT: "Inversión",
  DEBT: "Deuda",
}

export function sourceLabel(source: BalanceChangeSource): string {
  return SOURCE_LABELS[source] ?? source
}