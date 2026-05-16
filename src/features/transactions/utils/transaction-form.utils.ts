import type { Category } from "@/types/category"
import type { Project } from "@/types/project"

export function getTagsForCategory(categoryId: string | null | undefined, categories: Category[]): string[] {
  if (!categoryId) return []
  return categories.find((c) => c.id === categoryId)?.tags ?? []
}

export function getSubtypesForProject(projectId: string | null | undefined, projects: Project[]): string[] {
  if (!projectId) return []
  return projects.find((p) => p.id === projectId)?.subtypes ?? []
}
