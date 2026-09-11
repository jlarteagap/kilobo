import { NextResponse } from 'next/server'
import { creditsService } from '@/services/credits.service'
import { getUserId } from '@/lib/auth.server'
import { handleError } from '@/lib/api-utils'

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const rows = await creditsService.getUpcomingInstallments(userId)
    return NextResponse.json({ data: rows })
  } catch (error: unknown) {
    return handleError(error)
  }
}