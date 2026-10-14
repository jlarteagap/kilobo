import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth.server'
import { getDashboardMetricsCached, emptyDashboardMetrics } from '@/services/dashboard.service'

/**
 * Métricas agregadas del dashboard, calculadas en el servidor (design.md D4).
 *
 * Antes el navegador descargaba el historial completo de transacciones y lo
 * reducía en cada render. Ahora recibe un único documento ya agregado.
 */
export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const metrics = await getDashboardMetricsCached(userId)

    // Sin datos, la respuesta es una estructura válida y vacía — nunca nodos
    // nulos ni un error, que es lo que distingue esto de "no hay nada que hacer".
    return NextResponse.json({ data: metrics ?? emptyDashboardMetrics() }, { status: 200 })
  } catch (error: unknown) {
    console.error('[GET /api/dashboard/metrics]', error)
    return NextResponse.json({ error: 'Error al obtener las métricas' }, { status: 500 })
  }
}