import { driverDepositService } from '@/services/driver-deposit.service'
import { getUserId } from '@/lib/auth.server'

// GET /api/driver/deposits/reconciliation → por app: depositado vs pendiente (tarjeta + bonos)
export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

    const reconciliation = await driverDepositService.getReconciliation(userId)
    return Response.json({ data: reconciliation })
  } catch (error: unknown) {
    console.error('GET /api/driver/deposits/reconciliation error:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}