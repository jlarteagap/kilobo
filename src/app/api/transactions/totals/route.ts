import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth.server'
import { getFilteredTotals } from '@/services/transaction-page.service'

/**
 * Totales del conjunto filtrado.
 *
 * Existe porque los totales NO pueden derivarse de la página cargada: eso daría
 * cifras sobre un subconjunto sin avisar, que es el modo de fallo silencioso
 * que la paginación introduce. Se calculan sobre el conjunto completo que
 * describen los filtros.
 *
 * El coste queda acotado por los filtros elegidos. Pedir "todo el historial"
 * cuesta el historial, pero es una acción deliberada del usuario, no un peaje
 * automático en cada carga.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const p = req.nextUrl.searchParams
    const totals = await getFilteredTotals(userId, {
      from: p.get('from') ?? undefined,
      to: p.get('to') ?? undefined,
      accountId: p.get('account_id') ?? undefined,
      categoryId: p.get('category_id') ?? undefined,
      projectId: p.get('project_id') ?? undefined,
      tag: p.get('tag') ?? undefined,
      type: p.get('type') ?? undefined,
    })

    return NextResponse.json({ data: totals }, { status: 200 })
  } catch (error: unknown) {
    console.error('[GET /api/transactions/totals]', error)
    return NextResponse.json({ error: 'Error al obtener los totales' }, { status: 500 })
  }
}