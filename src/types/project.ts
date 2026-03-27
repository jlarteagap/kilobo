// types/project.ts

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string | null
  color: string          // hex, ej: "#FF6B35"
  icon?: string | null   // emoji, ej: "🚗"
  status: 'active' | 'archived'
  subtypes: string[]     // ["gasolina", "mantenimiento", "renta"]
  created_at: string
  updated_at: string
}

export interface CreateProjectData {
  name: string
  description?: string | null
  color: string
  icon?: string | null
  subtypes: string[]
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: 'active' | 'archived'
}