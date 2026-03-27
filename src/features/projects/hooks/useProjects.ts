// features/projects/hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Project, CreateProjectData, UpdateProjectData } from '@/types/project'

async function authFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}

export const projectKeys = {
  all:   ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  detail:(id: string) => [...projectKeys.all, 'detail', id] as const,
}

// ─── GET todos los proyectos ──────────────────────────────────────────────────
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: async (): Promise<Project[]> => {
      const res  = await authFetch('/api/projects')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener proyectos')
      return Array.isArray(json.data) ? json.data : []
    },
    staleTime: 1000 * 60 * 10, // proyectos cambian poco
  })
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export function useCreateProject() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProjectData): Promise<Project> => {
      const res  = await authFetch('/api/projects', { method: 'POST', body: JSON.stringify(data) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al crear proyecto')
      return json.data
    },
    onMutate: async (newProject) => {
      await qc.cancelQueries({ queryKey: projectKeys.lists() })
      const previous = qc.getQueryData<Project[]>(projectKeys.lists())
      qc.setQueryData<Project[]>(projectKeys.lists(), (old = []) => [
        {
          id: `temp-${Date.now()}`,
          user_id: '',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...newProject,
        },
        ...old,
      ])
      return { previous }
    },
    onError: (err: Error, _, ctx) => {
      if (ctx?.previous) qc.setQueryData(projectKeys.lists(), ctx.previous)
      toast.error(err.message)
    },
    onSuccess: () => toast.success('Proyecto creado'),
    onSettled: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
  })
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export function useUpdateProject() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectData }): Promise<Project> => {
      const res  = await authFetch(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al actualizar proyecto')
      return json.data
    },
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: projectKeys.lists() })
      const previous = qc.getQueryData<Project[]>(projectKeys.lists())
      qc.setQueryData<Project[]>(projectKeys.lists(), (old = []) =>
        old.map((p) => p.id === id ? { ...p, ...data } : p)
      )
      return { previous }
    },
    onError: (err: Error, _, ctx) => {
      if (ctx?.previous) qc.setQueryData(projectKeys.lists(), ctx.previous)
      toast.error(err.message)
    },
    onSuccess: () => toast.success('Proyecto actualizado'),
    onSettled: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
  })
}

// ─── DELETE (archive) ─────────────────────────────────────────────────────────
export function useDeleteProject() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res  = await authFetch(`/api/projects/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al eliminar proyecto')
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: projectKeys.lists() })
      const previous = qc.getQueryData<Project[]>(projectKeys.lists())
      qc.setQueryData<Project[]>(projectKeys.lists(), (old = []) =>
        old.filter((p) => p.id !== id)
      )
      return { previous }
    },
    onError: (err: Error, _, ctx) => {
      if (ctx?.previous) qc.setQueryData(projectKeys.lists(), ctx.previous)
      toast.error(err.message)
    },
    onSuccess: () => toast.success('Proyecto archivado'),
    onSettled: () => qc.invalidateQueries({ queryKey: projectKeys.lists() }),
  })
}