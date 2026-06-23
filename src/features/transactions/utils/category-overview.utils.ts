import type { Transaction, CategoryData } from "@/types/transaction"
import type { Project } from "@/types/project"
import { convertToBOB } from '@/lib/config/exchange-rates'

export interface SliceItem {
  name:       string
  value:      number
  color:      string
  icon?:      string
  isProject:  boolean
  itemId?:    string
}

const CATEGORY_COLORS = [
  '#B3D9FF', '#B3F0D9', '#FFD9B3', '#D9B3FF',
  '#FFB3B3', '#FFFAB3', '#B3FFD9', '#E0E0E0',
]

export function buildProjectSlices(
  projects: Project[],
  transactions: Transaction[],
  projectId: string | null,
): SliceItem[] {
  if (!projectId || projectId === '__personal__') return []

  const project = projects.find((p) => p.id === projectId)
  const color   = project?.color ?? '#6b7280'

  const expenses = transactions.filter(
    (t) => t.type === 'EXPENSE' && t.project_id === projectId
  )
  if (expenses.length === 0) return []

  const bySubtype = new Map<string, number>()
  expenses.forEach((t) => {
    const key = t.subtype ?? 'Sin etiqueta'
    bySubtype.set(key, (bySubtype.get(key) ?? 0) + convertToBOB(t.amount, t.currency))
  })

  const entries = Array.from(bySubtype.entries()).sort((a, b) => b[1] - a[1])
  return entries.map(([name, value], i) => ({
    name,
    value,
    color:     i === 0 ? color : color + Math.floor(255 * (1 - i * 0.15)).toString(16).padStart(2, '0'),
    isProject: true,
  }))
}

export function buildMixedSlices(
  projects: Project[],
  categories: CategoryData[],
  transactions: Transaction[],
  projectId: string | null,
): SliceItem[] {
  if (projectId && projectId !== '__personal__') return []

  const result: SliceItem[] = []

  categories.forEach((cat, i) => {
    if (cat.value > 0) {
      result.push({
        name:      cat.name,
        value:     cat.value,
        color:     cat.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        isProject: false,
        itemId:    cat.categoryId,
      })
    }
  })

  projects.forEach((project) => {
    const total = transactions
      .filter((t) => t.type === 'EXPENSE' && t.project_id === project.id)
      .reduce((s, t) => s + convertToBOB(t.amount, t.currency), 0)

    if (total > 0) {
      result.push({
        name:      project.name,
        value:     total,
        color:     project.color,
        icon:      project.icon ?? undefined,
        isProject: true,
        itemId:    project.id,
      })
    }
  })

  return result.sort((a, b) => b.value - a.value)
}

export function buildDetailSlices(
  selectedItem: { id: string; name: string; color: string; isProject: boolean } | null,
  transactions: Transaction[],
  isProjectMode: boolean,
): SliceItem[] {
  if (!selectedItem || isProjectMode) return []

  const expenses = transactions.filter(
    (t) => t.type === 'EXPENSE' && (
      selectedItem.isProject ? t.project_id === selectedItem.id : (t.category_id === selectedItem.id && !t.project_id)
    )
  )
  if (expenses.length === 0) return []

  const bySubItem = new Map<string, number>()
  expenses.forEach((t) => {
    const key = (selectedItem.isProject ? t.subtype : t.tag) ?? (selectedItem.isProject ? 'Sin etiqueta' : 'Sin tag')
    bySubItem.set(key, (bySubItem.get(key) ?? 0) + convertToBOB(t.amount, t.currency))
  })

  const color = selectedItem.color || '#6b7280'
  const entries = Array.from(bySubItem.entries()).sort((a, b) => b[1] - a[1])
  return entries.map(([name, value], i) => ({
    name,
    value,
    color:     i === 0 ? color : color + Math.floor(255 * (1 - i * 0.15)).toString(16).padStart(2, '0'),
    isProject: selectedItem.isProject,
    itemId:    selectedItem.id,
  }))
}
