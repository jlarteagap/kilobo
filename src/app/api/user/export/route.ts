import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth.server'
import { exportUserData } from '@/lib/user-account'

/**
 * Exportación de los datos propios (derecho de portabilidad).
 *
 * El filtro `user_id` se aplica en la base de datos dentro de
 * `exportUserData`, no aquí: filtrar en memoria significaría haber leído antes
 * los datos de otros usuarios.
 */
export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await exportUserData(userId)

    const stamp = new Date().toISOString().slice(0, 10)
    return new NextResponse(JSON.stringify({ exported_at: new Date().toISOString(), data }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="kilo-datos-${stamp}.json"`,
      },
    })
  } catch (error: unknown) {
    console.error('[GET /api/user/export]', error)
    return NextResponse.json({ error: 'Error al exportar los datos' }, { status: 500 })
  }
}