"use client"

import { useState, useMemo } from "react"
import { Plus, Trash2, Pencil, Search, LayoutGrid } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

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
function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50"
        >
          <Skeleton className="h-1 w-full" />
          <div className="p-5 flex items-center gap-4">
            <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-3 w-16 rounded-full" />
            </div>
          </div>
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
  const accentColor = category.color ?? '#6366f1' // Default Indigo-500
  const tags        = category.tags ?? []

  return (
    <div
      className="group relative bg-white dark:bg-neutral-900 rounded-[2rem] overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1"
    >
      {/* Subtle background glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      {/* Decorative accent dot */}
      <div 
        className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: accentColor }}
      />

      <div className="p-6">
        <div className="flex items-center gap-4 mb-5">
          {/* Icon with premium container */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm border border-white dark:border-neutral-800 ring-4 ring-neutral-50 dark:ring-neutral-950"
            style={{ backgroundColor: `${accentColor}10` }}
          >
            {category.icon ?? '📁'}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm leading-tight truncate tracking-tight">
              {category.name}
            </h3>
            {tags.length > 0 && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-semibold uppercase tracking-wider">
                {tags.length} Etiqueta{tags.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Tags with improved style */}
        <div className="flex flex-wrap gap-1.5 h-6 overflow-hidden">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center text-[10px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 px-2.5 py-0.5 rounded-lg border border-neutral-200/30 dark:border-neutral-700/30 transition-colors hover:border-neutral-300 dark:hover:border-neutral-600"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] font-bold text-neutral-400 px-1">
              +{tags.length - 3}
            </span>
          )}
        </div>

        {/* Action buttons revealed on hover */}
        <div className="mt-5 pt-4 border-t border-neutral-100/50 dark:border-neutral-800/50 flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(category)}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
            aria-label="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200"
            aria-label="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dialog State Type ────────────────────────────────────────────────────────
type DialogState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; category: Category; lockedTags: string[] }

// ─── Main Component ───────────────────────────────────────────────────────────
export function CategoriesList() {
  const { data: categories = [], isLoading } = useCategories()
  const deleteCategory = useDeleteCategory()

  const [search, setSearch]                   = useState('')
  const [dialog, setDialog]                   = useState<DialogState>({ mode: 'closed' })
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) && !c.parent_id
    )
  }, [categories, search])

  const handleEdit = (category: Category) => {
    setDialog({
      mode: 'edit',
      category,
      lockedTags: [],
    })
  }

  const handleNewCategory = () => {
    setDialog({ mode: 'create' })
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return
    await deleteCategory.mutateAsync(pendingDeleteId)
    setPendingDeleteId(null)
  }

  const isDialogOpen = dialog.mode !== 'closed'

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">

      {/* ── Header Area ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tightest">
              Categorías
            </h1>
          </div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed">
            Organiza y estructura tus movimientos financieros con un sistema de categorías inteligente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar categorías..."
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-[1.25rem] text-sm font-semibold text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all duration-300 shadow-sm"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}>
            <DialogTrigger asChild>
              <button
                onClick={handleNewCategory}
                className="flex items-center gap-2 px-6 py-3.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-bold rounded-[1.25rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span className="hidden sm:inline">Nueva</span>
              </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md rounded-[2.5rem] border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tightest mb-4">
                  {dialog.mode === 'edit' ? 'Editar Categoría' : 'Nueva Categoría'}
                </DialogTitle>
              </DialogHeader>

              {dialog.mode === 'create' ? (
                <CategoryForm
                  mode="create"
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
      </div>

      {/* ── Content Grid ── */}
      {isLoading ? (
        <CategoriesSkeleton />
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-neutral-50/50 dark:bg-neutral-900/30 rounded-[3rem] border border-dashed border-neutral-200 dark:border-neutral-800">
          <div className="w-20 h-20 rounded-[2.5rem] bg-white dark:bg-neutral-900 flex items-center justify-center mb-6 shadow-xl border border-neutral-100 dark:border-neutral-800">
            <Search className="w-8 h-8 text-neutral-300" />
          </div>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Sin resultados</p>
          <p className="text-sm text-neutral-500 mt-2 max-w-[240px]">
            {search ? 'No encontramos categorías que coincidan con tu búsqueda.' : 'Parece que aún no has creado ninguna categoría.'}
          </p>
          {!search && (
            <button
              onClick={handleNewCategory}
              className="mt-8 text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Crea la primera categoría →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={handleEdit}
              onDelete={setPendingDeleteId}
            />
          ))}
          
          {/* Subtle Add Empty State Card */}
          <button
            onClick={handleNewCategory}
            className="group relative flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-indigo-500/50 hover:bg-indigo-50/10 transition-all duration-500 min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-all">
              <Plus className="w-5 h-5 text-neutral-400 group-hover:text-indigo-600" />
            </div>
            <span className="text-sm font-bold text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
              Nueva Categoría
            </span>
          </button>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[3rem] border-neutral-200 dark:border-neutral-800 p-10 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tightest">¿Eliminar esta categoría?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500 dark:text-neutral-400 text-sm font-medium leading-relaxed mt-2">
              Esta acción es permanente. Si la categoría tiene transacciones vinculadas, el sistema impedirá su borrado por seguridad.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="w-full sm:w-auto rounded-2xl border-neutral-200/50 px-8 py-6 font-bold">
              Mantener
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="w-full sm:w-auto rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-8 py-6 font-bold shadow-lg shadow-rose-500/20"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}