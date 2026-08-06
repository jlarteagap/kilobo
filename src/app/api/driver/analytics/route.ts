import { driverService } from '@/services/driver.service'
import { getUserId } from '@/lib/auth.server'

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const analytics = await driverService.getAnalytics(userId)
    return Response.json({ data: analytics })
  } catch (error: unknown) {
    console.error('GET /api/driver/analytics error:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
