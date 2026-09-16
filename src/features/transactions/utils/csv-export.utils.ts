import { convertToBOB } from "@/lib/config/exchange-rates"
import { normalizeCurrency } from "./transaction-display.utils"
import type { Transaction } from "@/types/transaction"
import type { Account }     from "@/types/account"
import type { Category }    from "@/types/category"
import type { Project }     from "@/types/project"

export interface TransactionCSVRow {
  Fecha:       string
  Categoría:   string
  Etiqueta:    string
  Cuenta:      string
  Descripción: string
  Tipo:        string
  Monto:       number
  Moneda:      string
  Proyecto:    string
}

function getAccountName(id: string | null, accounts: Account[]): string {
  if (!id) return ""
  return accounts.find((a) => a.id === id)?.name ?? ""
}

function getCategoryName(id: string | null, categories: Category[]): string {
  if (!id) return ""
  return categories.find((c) => c.id === id)?.name ?? ""
}

function getProjectName(id: string | null | undefined, projects: Project[]): string {
  if (!id) return "Personal"
  return projects.find((p) => p.id === id)?.name ?? ""
}

const TYPE_LABELS: Record<string, string> = {
  INCOME:   "Ingreso",
  EXPENSE:  "Gasto",
  TRANSFER: "Transferencia",
  SAVING:   "Ahorro",
}

export function buildTransactionRows(
  transactions: Transaction[],
  accounts:     Account[],
  categories:   Category[],
  projects:     Project[],
): TransactionCSVRow[] {
  return transactions.map((tx) => ({
    Fecha:       tx.date.slice(0, 10),
    Categoría:   getCategoryName(tx.category_id, categories),
    Etiqueta:    tx.tag ?? "",
    Cuenta:      getAccountName(tx.account_id, accounts),
    Descripción: tx.description ?? "",
    Tipo:        TYPE_LABELS[tx.type] ?? tx.type,
    Monto:       Math.round(convertToBOB(tx.amount, normalizeCurrency(tx.currency)) * 100) / 100,
    Moneda:      normalizeCurrency(tx.currency),
    Proyecto:    getProjectName(tx.project_id, projects),
  }))
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function exportToCSV(rows: TransactionCSVRow[], filename: string): void {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0]) as (keyof TransactionCSVRow)[]
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h]
        return typeof val === 'number' ? val.toFixed(2) : escapeCSV(String(val))
      }).join(',')
    ),
  ]

  const csv = '\uFEFF' + lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href     = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
