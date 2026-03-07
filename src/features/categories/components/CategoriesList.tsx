"use client"

import { useState } from "react"
import { Plus, Trash2, Pencil, Search } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"

import { CategoryForm } from "./form/CategoryForm"
import { useCategories, useDeleteCategory } from "../hooks/useCategories"
import type { Category } from "@/types/category"

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function KanbanSkeleton() {
  return (
    <div className="flex gap-4">
      {[0, 1].map((col) => (
        <div key={col} className="flex-1 flex flex-col gap-2.5">
          <Skeleton className="h-11 w-full rounded-2xl" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <Skeleton className="h-1 w-full" />
              <div className="p-4 flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-28 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Category Card ────────────────────────────────────────────────────────────
function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category
  onEdit:   (category: Category) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isIncome    = category.type === 'INCOME'
  const accentColor = category.color ?? (isIncome ? '#10b981' : '#f43f5e') // Use Tailwind emerald-500/rose-500
  const tags        = category.tags ?? []
  const visibleTags = expanded ? tags : tags.slice(0, 4)
  const hiddenCount = tags.length - 4

  return (
    <div
      className="group relative bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5"
    >
      {/* Barra de acento sutil */}
      <div className="h-1 w-full opacity-60" style={{ backgroundColor: accentColor }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Icono con contenedor estilizado */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ring-1 ring-inset ring-black/5 dark:ring-white/5"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              {category.icon ?? '📁'}
            </div>

            {/* Nombre */}
            <div className="min-w-0">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-[13px] leading-tight truncate tracking-tight">
                {category.name}
              </p>
              {tags.length > 0 ? (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
                  {tags.length} etiqueta{tags.length !== 1 ? 's' : ''}
                </p>
              ) : null}
            </div>
          </div>

          {/* Acciones — mejor integradas */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
            <button
              onClick={() => onEdit(category)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(category.id)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tags con mejor espaciado y contraste */}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-100/50 dark:bg-neutral-800/50 px-2 py-0.5 rounded-md border border-neutral-200/50 dark:border-neutral-700/50"
              >
                {tag}
              </span>
            ))}
            {!expanded && hiddenCount > 0 ? (
              <button
                onClick={() => setExpanded(true)}
                className="text-[10px] font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 px-2 py-0.5 rounded-md border border-dashed border-neutral-200 dark:border-neutral-700 transition-colors"
              >
                +{hiddenCount}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({
  title,
  type,
  categories,
  onEdit,
  onDelete,
  onNewCategory,
}: {
  title:        string
  type:         'INCOME' | 'EXPENSE'
  categories:   Category[]
  onEdit:       (category: Category) => void
  onDelete:     (id: string) => void
  onNewCategory: () => void
}) {
  const isIncome = type === 'INCOME'

  return (
    <div className="flex-1 min-w-[280px] flex flex-col gap-3">
      {/* Header de columna más elegante */}
      <div className={cn(
        'flex items-center justify-between px-4 py-2.5 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50',
        isIncome ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'bg-rose-50/50 dark:bg-rose-950/20'
      )}>
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-1.5 h-1.5 rounded-full ring-4',
            isIncome ? 'bg-emerald-500 ring-emerald-500/10' : 'bg-rose-500 ring-rose-500/10'
          )} />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">{title}</span>
        </div>
        <span className={cn(
          'text-[11px] font-bold px-2 py-0.5 rounded-lg ring-1 ring-inset',
          isIncome
            ? 'bg-emerald-100 text-emerald-700 ring-emerald-700/10 dark:bg-emerald-900/50 dark:text-emerald-400'
            : 'bg-rose-100 text-rose-700 ring-rose-700/10 dark:bg-rose-900/50 dark:text-rose-400'
        )}>
          {categories.length}
        </span>
      </div>

      {/* Cards con scroll si es necesario */}
      <div className="flex flex-col gap-3">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {/* Botón añadir con nueva estética */}
        <button
          onClick={onNewCategory}
          className={cn(
            'group w-full flex items-center justify-center gap-2 py-4 rounded-2xl transition-all duration-200',
            'border-2 border-dashed border-neutral-200 dark:border-neutral-800',
            'hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10',
            'text-[13px] font-medium text-neutral-400 hover:text-emerald-600 transition-colors'
          )}
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </div>
          {isIncome ? 'Añadir ingreso' : 'Añadir gasto'}
        </button>
      </div>
    </div>
  )
}

// ─── Tipos de estado del dialog ───────────────────────────────────────────────
type DialogState =
  | { mode: 'closed' }
  | { mode: 'create'; preselectedType?: 'INCOME' | 'EXPENSE' }
  | { mode: 'edit';   category: Category; lockedTags: string[] }

// ─── Componente principal ─────────────────────────────────────────────────────
export function CategoriesList() {
  const { data: categories = [], isLoading } = useCategories()
  const deleteCategory = useDeleteCategory()

  const [search, setSearch]           = useState('')
  const [dialog, setDialog]           = useState<DialogState>({ mode: 'closed' })
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const filtered = search.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : categories

  const incomeCategories  = filtered.filter((c) => c.type === 'INCOME'  && !c.parent_id)
  const expenseCategories = filtered.filter((c) => c.type === 'EXPENSE' && !c.parent_id)

  const totalIncome  = categories.filter((c) => c.type === 'INCOME'  && !c.parent_id).length
  const totalExpense = categories.filter((c) => c.type === 'EXPENSE' && !c.parent_id).length

  const handleEdit = (category: Category) => {
    setDialog({
      mode: 'edit',
      category,
      lockedTags: [],
    })
  }

  const handleNewCategory = (type?: 'INCOME' | 'EXPENSE') => {
    setDialog({ mode: 'create', preselectedType: type })
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return
    await deleteCategory.mutateAsync(pendingDeleteId)
    setPendingDeleteId(null)
  }

  const isDialogOpen = dialog.mode !== 'closed'

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Categorías
          </h1>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
            Gestiona la estructura de tus flujos de caja.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}>
          <DialogTrigger asChild>
            <button
              onClick={() => handleNewCategory()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-95 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </button>
          </DialogTrigger>

          <DialogContent className="rounded-3xl border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">
                {dialog.mode === 'edit' ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
            </DialogHeader>

            {dialog.mode === 'create' ? (
              <CategoryForm
                mode="create"
                preselectedType={dialog.preselectedType}
                onSuccess={() => setDialog({ mode: 'closed' })}
              />
            ) : null}
            {dialog.mode === 'edit' ? (
              <CategoryForm
                mode="edit"
                category={dialog.category}
                lockedTags={dialog.lockedTags}
                onSuccess={() => setDialog({ mode: 'closed' })}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Stats & Search Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 flex gap-3">
          <div className="flex-1 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl px-5 py-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Ingresos</span>
            <span className="text-xl font-bold text-emerald-600">{totalIncome}</span>
          </div>
          <div className="flex-1 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl px-5 py-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Gastos</span>
            <span className="text-xl font-bold text-rose-600">{totalExpense}</span>
          </div>
        </div>
        
        <div className="md:col-span-4 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl text-[13px] font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all duration-300 shadow-sm"
          />
        </div>
      </div>

      {/* ── Kanban / Skeleton / Empty ── */}
      {isLoading ? (
        <KanbanSkeleton />
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-3xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4 ring-1 ring-neutral-200 dark:ring-neutral-800">
            <Search className="w-6 h-6 text-neutral-300" />
          </div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">No hay categorías</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-[200px]">Crea una estructura para empezar a clasificar tus finanzas.</p>
          <button
            onClick={() => handleNewCategory()}
            className="mt-6 text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
          >
            Crea la primera →
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 items-start pb-12">
          <KanbanColumn
            title="Ingresos"
            type="INCOME"
            categories={incomeCategories}
            onEdit={handleEdit}
            onDelete={setPendingDeleteId}
            onNewCategory={() => handleNewCategory('INCOME')}
          />
          <KanbanColumn
            title="Gastos"
            type="EXPENSE"
            categories={expenseCategories}
            onEdit={handleEdit}
            onDelete={setPendingDeleteId}
            onNewCategory={() => handleNewCategory('EXPENSE')}
          />
        </div>
      )}

      {/* ── AlertDialog de confirmación de borrado ── */}
      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[2rem] border-neutral-200 dark:border-neutral-800 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight">¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500 dark:text-neutral-400 text-[13px] font-medium">
              Esta acción no se puede deshacer. Si la categoría tiene
              transacciones asociadas no podrá eliminarse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="rounded-2xl border-neutral-200/50 px-6 font-semibold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-6 font-semibold"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}