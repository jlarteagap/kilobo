// features/projects/ProjectsList.tsx
"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Lightbulb } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button }   from "@/components/ui/button"
import { toast }    from "sonner"

import { ProjectForm } from "./ProjectForm"
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "./hooks/useProjects"
import type { Project, CreateProjectData } from "@/types/project"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"

// ─── Skeleton ────────────────────────────────────────────────────────────────
function ProjectsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-neutral-900/50 rounded-xl p-4 flex items-center gap-4 border border-neutral-200/60 dark:border-neutral-800/60">
          <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({
  project,
  onEdit,
  onDelete,
  compact = false,
}: {
  project:  Project
  onEdit:   (project: Project) => void
  onDelete: (id: string) => void
  compact?: boolean
}) {
  return (
    <div className="group relative bg-white dark:bg-neutral-900/50 rounded-xl p-4 flex items-center gap-4 border border-neutral-200/60 dark:border-neutral-800/60 transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm">
      
      {/* Icono con color sutil */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: project.color + '12' }}
      >
        {project.icon ?? '📁'}
      </div>

      {/* Info Principal */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
          {project.name}
        </h3>
        {!compact && project.description && (
          <p className="text-[11px] text-neutral-500 truncate">
            {project.description}
          </p>
        )}
      </div>

      {/* Acciones flotantes discretas */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(project)}
          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(project.id)}
          className="p-1.5 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Tipo de dialog — mismo patrón que AccountsList ──────────────────────────
type DialogState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; project: Project }

// ─── Componente principal ─────────────────────────────────────────────────────
export function ProjectsList({ isSidebar = false }: { isSidebar?: boolean }) {
  const { data: projects = [], isLoading, isError } = useProjects()

  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const [dialog, setDialog]                   = useState<DialogState>({ mode: 'closed' })
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const handleCreate = (data: CreateProjectData) => {
    createProject.mutate(data, {
      onSuccess: () => {
        setDialog({ mode: 'closed' })
        toast.success('Actividad creada')
      },
      onError: () => toast.error('Error al crear la actividad'),
    })
  }

  const handleUpdate = (data: CreateProjectData) => {
    if (dialog.mode !== 'edit') return
    updateProject.mutate({ id: dialog.project.id, data }, {
      onSuccess: () => {
        setDialog({ mode: 'closed' })
        toast.success('Actividad actualizada')
      },
      onError: () => toast.error('Error al actualizar la actividad'),
    })
  }

  const handleDeleteConfirm = () => {
    if (!pendingDeleteId) return
    deleteProject.mutate(pendingDeleteId, {
      onSuccess: () => {
        toast.success('Actividad archivada')
        setPendingDeleteId(null)
      },
      onError: () => {
        toast.error('Error al archivar la actividad')
        setPendingDeleteId(null)
      },
    })
  }

  const isDialogOpen = dialog.mode !== 'closed'
  const isPending    = createProject.isPending || updateProject.isPending

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className={cn(
            "font-bold text-neutral-900 dark:text-neutral-100 tracking-tight",
            isSidebar ? "text-lg" : "text-2xl"
          )}>
            Actividades
          </h2>
          {!isSidebar && (
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Agrupa ingresos y gastos de un trabajo, negocio o pasatiempo.
            </p>
          )}
        </div>

        <Button
          onClick={() => setDialog({ mode: 'create' })}
          className={cn(
            "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm hover:opacity-90",
            isSidebar ? "h-8 px-3" : "h-9 px-4"
          )}
        >
          <Plus className={cn("mr-1.5", isSidebar ? "w-3.5 h-3.5" : "w-4 h-4")} />
          {isSidebar ? "Nueva" : "Nueva Actividad"}
        </Button>
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <ProjectsGridSkeleton />
      ) : isError ? (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-[13px] p-4 rounded-xl border border-rose-100 dark:border-rose-900/50 font-medium">
          Error al cargar las actividades.
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/20">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center mb-3 text-xl">
            📁
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Sin actividades
          </h3>
          <p className="text-[11px] text-neutral-500 mt-1 max-w-[200px]">
            Crea tu primera actividad para agrupar ingresos y gastos.
          </p>
        </div>
      ) : (
        <div className={cn(
          "grid gap-3",
          isSidebar ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              compact={isSidebar}
              onEdit={(p) => setDialog({ mode: 'edit', project: p })}
              onDelete={setPendingDeleteId}
            />
          ))}
        </div>
      )}

      {/* ── Dialog crear/editar ── */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setDialog({ mode: 'closed' })}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-neutral-200/50 dark:border-neutral-800/50 p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              {dialog.mode === 'edit' ? 'Editar Actividad' : 'Nueva Actividad'}
            </DialogTitle>
          </DialogHeader>
          {/* ── Onboarding — solo la primera vez ── */}
          {dialog.mode === 'create' && projects.length === 0 && (
            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-[13px] font-semibold text-amber-800 leading-tight">
                    ¿Para qué sirve una actividad?
                  </p>
                  <p className="text-[12px] text-amber-700 leading-relaxed">
                    Agrupa los ingresos y gastos de un mismo trabajo, negocio o pasatiempo para saber si realmente es rentable.
                  </p>
                  <p className="text-[12px] text-amber-700/70 leading-relaxed">
                    Por ejemplo: ventas en línea, clases particulares, construcción de muebles, alquiler de un departamento.
                  </p>
                </div>
              </div>
            </div>
          )}

          <ProjectForm
            initialData={dialog.mode === 'edit' ? dialog.project : undefined}
            onSubmit={dialog.mode === 'edit' ? handleUpdate : handleCreate}
            onCancel={() => setDialog({ mode: 'closed' })}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog eliminar ── */}
      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[2.5rem] border-neutral-200 dark:border-neutral-800 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight">
              ¿Archivar actividad?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500 dark:text-neutral-400 text-[13px] font-medium leading-relaxed">
              La actividad dejará de aparecer en los selectores. Las transacciones asociadas conservan su historial intacto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl border-neutral-200/50 px-6 font-bold">
              Mantener
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-6 font-bold"
            >
              Archivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}