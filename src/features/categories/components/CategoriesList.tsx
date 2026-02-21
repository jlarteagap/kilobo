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
  const accentColor = category.color ?? (isIncome ? '#B3F0D9' : '#FFB3B3')
  const tags        = category.tags ?? []
  const visibleTags = expanded ? tags : tags.slice(0, 4)
  const hiddenCount = tags.length - 4

  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      {/* Barra de acento */}
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Icono */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: `${accentColor}50` }}
            >
              {category.icon ?? '📁'}
            </div>

            {/* Nombre */}
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm leading-tight truncate">
                {category.name}
              </p>
              {tags.length > 0 && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {tags.length} etiqueta{tags.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Acciones — visibles en hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
            <button
              onClick={() => onEdit(category)}
              title="Editar categoría"
              className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all duration-150"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(category.id)}
              title="Eliminar categoría"
              className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all duration-150"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100"
              >
                {tag}
              </span>
            ))}
            {!expanded && hiddenCount > 0 && (
              <button
                onClick={() => setExpanded(true)}
                className="text-[11px] text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded-full border border-dashed border-gray-200 hover:border-gray-300 transition-colors"
              >
                +{hiddenCount} más
              </button>
            )}
            {expanded && (
              <button
                onClick={() => setExpanded(false)}
                className="text-[11px] text-gray-400 hover:text-gray-600 px-2 py-0.5 transition-colors"
              >
                Ver menos
              </button>
            )}
          </div>
        )}
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
    <div className="flex-1 min-w-0 flex flex-col gap-2.5">
      {/* Header de columna */}
      <div className={cn(
        'flex items-center justify-between px-4 py-3 rounded-2xl',
        isIncome ? 'bg-emerald-50' : 'bg-rose-50'
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            isIncome ? 'bg-emerald-400' : 'bg-rose-400'
          )} />
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          isIncome
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-rose-100 text-rose-700'
        )}>
          {categories.length}
        </span>
      </div>

      {/* Cards */}
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {/* Botón añadir */}
      <button
        onClick={onNewCategory}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded-2xl',
          'border-2 border-dashed text-sm text-gray-400',
          'hover:text-gray-600 transition-colors duration-150',
          isIncome
            ? 'border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/50'
            : 'border-rose-200 hover:border-rose-300 hover:bg-rose-50/50'
        )}
      >
        <Plus className="w-4 h-4" />
        {isIncome ? 'Nuevo ingreso' : 'Nuevo gasto'}
      </button>
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

  // ─── Datos filtrados ────────────────────────────────────────────────────────
  const filtered = search.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : categories

  const incomeCategories  = filtered.filter((c) => c.type === 'INCOME'  && !c.parent_id)
  const expenseCategories = filtered.filter((c) => c.type === 'EXPENSE' && !c.parent_id)

  // Stats sobre datos sin filtrar
  const totalIncome  = categories.filter((c) => c.type === 'INCOME'  && !c.parent_id).length
  const totalExpense = categories.filter((c) => c.type === 'EXPENSE' && !c.parent_id).length

  // ─── Calcular tags bloqueados ───────────────────────────────────────────────
  // Se calculan en el cliente con los datos en caché — sin llamadas extra
  // Un tag está "en uso" si aparece en alguna transacción (lo sabe el service),
  // pero aquí mostramos todos los tags como potencialmente bloqueados en edición.
  // El server validará y devolverá 409 si se intenta eliminar uno en uso.
  const getLockedTags = (category: Category): string[] => {
    // Por ahora retorna vacío — el server protege con 409
    // Si quieres pre-calcular en cliente, necesitarías traer las transacciones
    return []
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleEdit = (category: Category) => {
    setDialog({
      mode:       'edit',
      category,
      lockedTags: getLockedTags(category),
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
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Categorías
          </h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            {totalIncome + totalExpense} categorías
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}>
          <DialogTrigger asChild>
            <button
              onClick={() => handleNewCategory()}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5',
                'bg-gray-900 text-white text-sm font-medium',
                'rounded-xl shadow-sm hover:shadow-md hover:bg-gray-800',
                'transition-all duration-200'
              )}
            >
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </button>
          </DialogTrigger>

          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {dialog.mode === 'edit' ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
            </DialogHeader>

            {/* Renderiza el form correcto según el modo */}
            {dialog.mode === 'create' && (
              <CategoryForm
                mode="create"
                preselectedType={dialog.preselectedType}
                onSuccess={() => setDialog({ mode: 'closed' })}
              />
            )}
            {dialog.mode === 'edit' && (
              <CategoryForm
                mode="edit"
                category={dialog.category}
                lockedTags={dialog.lockedTags}
                onSuccess={() => setDialog({ mode: 'closed' })}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Stats ── */}
      {!isLoading && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-700">Ingresos</span>
            <span className="text-2xl font-semibold text-emerald-600">{totalIncome}</span>
          </div>
          <div className="bg-rose-50 rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-rose-700">Gastos</span>
            <span className="text-2xl font-semibold text-rose-600">{totalExpense}</span>
          </div>
        </div>
      )}

      {/* ── Búsqueda ── */}
      {!isLoading && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categorías…"
            className={cn(
              'w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm',
              'text-gray-700 placeholder:text-gray-300',
              'focus:outline-none focus:ring-2 focus:ring-gray-900/10',
              'transition-all duration-200'
            )}
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          />
        </div>
      )}

      {/* ── Kanban / Skeleton / Empty ── */}
      {isLoading ? (
        <KanbanSkeleton />
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No hay categorías aún.{' '}
          <button
            onClick={() => handleNewCategory()}
            className="text-gray-700 underline underline-offset-2 hover:text-gray-900 transition-colors"
          >
            Crea la primera
          </button>
        </div>
      ) : (
        <div className="flex gap-4 items-start">
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
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Si la categoría tiene
              transacciones asociadas no podrá eliminarse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}