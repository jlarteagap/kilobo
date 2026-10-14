// src/app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { transactionService } from '@/services/transactions.service'
import { transactionPageService } from '@/services/transaction-page.service'
import { createTransactionSchema } from '@/lib/validations/transaction.schema'
import { getUserId } from '@/lib/auth.server'
import { assertSameOrigin } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const page = await transactionPageService.getPage(userId, {
      cursor: req.nextUrl.searchParams.get('cursor') ?? undefined,
      limit: req.nextUrl.searchParams.get('limit') ?? undefined,
      from: req.nextUrl.searchParams.get('from') ?? undefined,
      to: req.nextUrl.searchParams.get('to') ?? undefined,
      accountId: req.nextUrl.searchParams.get('account_id') ?? undefined,
      categoryId: req.nextUrl.searchParams.get('category_id') ?? undefined,
      projectId: req.nextUrl.searchParams.get('project_id') ?? undefined,
      tag: req.nextUrl.searchParams.get('tag') ?? undefined,
      type: req.nextUrl.searchParams.get('type') ?? undefined,
    })

    return NextResponse.json({ data: page.items, nextCursor: page.nextCursor })
  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function POST(req: NextRequest) {
  const originError = assertSameOrigin(req)
  if (originError) return originError

  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createTransactionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const result = await transactionService.createWithBalance(parsed.data, userId)
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error: unknown) {
    return handleError(error)
  }
}

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Error interno del servidor'
  const status = message.includes('No encontrado') || message.includes('no encontrada') ? 404 : 500
  if (status === 500) console.error('[transactions]', message)
  return NextResponse.json({ error: message }, { status })
}