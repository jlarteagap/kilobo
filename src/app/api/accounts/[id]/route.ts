// app/api/accounts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { accountsService } from '@/services/accounts.service'
import { updateAccountSchema } from '@/lib/validations/account.schema'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body   = await req.json()

    const parsed = updateAccountSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const account = await accountsService.updateAccount(id, parsed.data)
    return NextResponse.json({ data: account })
  } catch (error: any) {
    return handleError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await accountsService.deleteAccount(id)
    return NextResponse.json({ success: true })  // ← nunca 204, siempre JSON
  } catch (error: any) {
    return handleError(error)
  }
}

// ─── Handler centralizado — usado por ambos ───────────────────────────────────
function handleError(error: any): NextResponse {
  const message = error?.message ?? 'Error interno del servidor'
  const statusMap: Record<string, number> = {
    'No autorizado':             401,
    'Token inválido o expirado': 401,
    'Cuenta no encontrada.':     404,
    'No se puede eliminar una cuenta que tiene transacciones asociadas.': 409,
  }
  const status = statusMap[message] ?? 500
  return NextResponse.json({ error: message }, { status })
}