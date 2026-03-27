// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/services/project.service'
import { updateProjectSchema } from '@/lib/validations/project.schema'
import { getUserId } from '@/lib/auth.server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const body   = await req.json()
    const parsed = updateProjectSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const project = await projectService.update(id, parsed.data, userId)
    return NextResponse.json({ data: project })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    await projectService.archive(id, userId)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error interno' }, { status: 500 })
  }
}