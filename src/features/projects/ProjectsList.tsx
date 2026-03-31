// features/projects/ProjectsList.tsx
"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"

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

// ─── Skeleton — mismas dimensiones que AccountCard ───────────────────────────
function ProjectsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-[2rem] p-6 border border-neutral-200/50">
          <div className="flex items-start justify-between mb-4">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
          <Skeleton className="h-4 w-28 rounded-full mb-2" />
          <Skeleton className="h-3 w-20 rounded-full mb-6" />
          <div className="flex gap-1.5 pt-4 border-t border-neutral-100">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Project Card — mismo lenguaje visual que AccountCard ────────────────────
function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project:  Project
  onEdit:   (project: Project) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="group relative bg-white dark:bg-neutral-900 rounded-[2rem] p-6 flex flex-col gap-5 border border-neutral-200/50 dark:border-neutral-800/50 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:-translate-y-1">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ring-1 ring-inset ring-black/5 dark:ring-white/5 shadow-sm"
          style={{ backgroundColor: project.color + '18' }}
        >
          {project.icon ?? '📁'}
        </div>

        {/* Acciones — igual que AccountCard */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
          <button
            onClick={() => onEdit(project)}
            className="p-2 rounded-xl text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Nombre + descripción ── */}
      <div className="space-y-1">
        <h3 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug">
          {project.name}
        </h3>
        {project.description ? (
          <p className="text-[12px] text-neutral-400 leading-relaxed line-clamp-2">
            {project.description}
          </p>
        ) : (
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Sin descripción
          </p>
        )}
      </div>

      {/* ── Subtipos — al fondo, igual que el balance en AccountCard ── */}
      <div className="pt-4 mt-auto border-t border-neutral-100 dark:border-neutral-800/50">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          Subtipos
        </span>
        {project.subtypes.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {project.subtypes.map((s) => (
              <span
                key={s}
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                style={{ borderColor: project.color + '40', color: project.color }}
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-neutral-300 mt-1">Sin subtipos definidos</p>
        )}
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
export function ProjectsList() {
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
        toast.success('Proyecto creado')
      },
      onError: () => toast.error('Error al crear el proyecto'),
    })
  }

  const handleUpdate = (data: CreateProjectData) => {
    if (dialog.mode !== 'edit') return
    updateProject.mutate({ id: dialog.project.id, data }, {
      onSuccess: () => {
        setDialog({ mode: 'closed' })
        toast.success('Proyecto actualizado')
      },
      onError: () => toast.error('Error al actualizar el proyecto'),
    })
  }

  const handleDeleteConfirm = () => {
    if (!pendingDeleteId) return
    deleteProject.mutate(pendingDeleteId, {
      onSuccess: () => {
        toast.success('Proyecto archivado')
        setPendingDeleteId(null)
      },
      onError: () => {
        toast.error('Error al archivar el proyecto')
        setPendingDeleteId(null)
      },
    })
  }

  const isDialogOpen = dialog.mode !== 'closed'
  const isPending    = createProject.isPending || updateProject.isPending

  return (
    <div className="space-y-6">

      {/* ── Header — mismo estilo que AccountsList ── */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">
            Proyectos
          </h2>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Unidades de negocio para rastrear rentabilidad.
          </p>
        </div>

        <Button
          onClick={() => setDialog({ mode: 'create' })}
          className="h-12 px-6 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-2xl font-bold transition-all duration-200 active:scale-95 shadow-xl shadow-black/10 dark:shadow-white/5 hover:opacity-90"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <ProjectsGridSkeleton />
      ) : isError ? (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-sm p-6 rounded-[2rem] border border-rose-100 dark:border-rose-900/50 font-medium">
          Error al cargar los proyectos. Por favor, intenta de nuevo.
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-[2.5rem] bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center mb-6 text-3xl">
            📁
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Sin proyectos aún
          </h3>
          <p className="text-sm text-neutral-500 mt-2 max-w-[280px]">
            Crea tu primer proyecto para separar y analizar tus ingresos y gastos por actividad.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
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
              {dialog.mode === 'edit' ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </DialogTitle>
          </DialogHeader>
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
              ¿Archivar proyecto?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500 dark:text-neutral-400 text-[13px] font-medium leading-relaxed">
              El proyecto dejará de aparecer en los selectores. Las transacciones asociadas conservan su historial intacto.
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