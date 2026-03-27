// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/services/project.service'
import { createProjectSchema } from '@/lib/validations/project.schema'
import { getUserId } from '@/lib/auth.server'

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const projects = await projectService.getAll(userId)
    return NextResponse.json({ data: projects })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body   = await req.json()
    const parsed = createProjectSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const project = await projectService.create(parsed.data, userId)
    return NextResponse.json({ data: project }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error interno' }, { status: 500 })
  }
}