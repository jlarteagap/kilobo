// services/project.service.ts
import { projectRepository } from '@/repositories/project.repository'
import type { CreateProjectData, UpdateProjectData, Project } from '@/types/project'

export const projectService = {
  async getAll(userId: string): Promise<Project[]> {
    return projectRepository.findAll(userId)
  },

  async getById(id: string, userId: string): Promise<Project> {
    const project = await projectRepository.findById(id, userId)
    if (!project) throw new Error('Proyecto no encontrado o no autorizado.')
    return project
  },

  async create(data: CreateProjectData, userId: string): Promise<Project> {
    return projectRepository.create(data, userId)
  },

  async update(id: string, data: UpdateProjectData, userId: string): Promise<Project> {
    await projectService.getById(id, userId) // valida ownership
    return projectRepository.update(id, data, userId)
  },

  async archive(id: string, userId: string): Promise<void> {
    await projectService.getById(id, userId)
    await projectRepository.update(id, { status: 'archived' }, userId)
  },
}