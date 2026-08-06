import { NextRequest } from 'next/server'
import { driverConfigRepository } from '@/repositories/driver-config.repository'
import { driverConfigSchema } from '@/lib/validations/driver.schema'
import { getUserId } from '@/lib/auth.server'

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const config = await driverConfigRepository.findByUserId(userId)
    return Response.json({ data: config })
  } catch (error: unknown) {
    console.error('GET /api/driver/config error:', error)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = driverConfigSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    await driverConfigRepository.upsert(userId, parsed.data)
    return Response.json({ success: true })
  } catch (error: unknown) {
    console.error('PUT /api/driver/config error:', error)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}
