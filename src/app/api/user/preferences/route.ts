import { NextRequest, NextResponse } from 'next/server'
import { userPreferencesRepository } from '@/repositories/user-preferences.repository'
import { z } from 'zod'
import { getUserId } from '@/lib/auth.server'
import { handleError } from '@/lib/api-utils'

const updatePreferencesSchema = z.object({
  displayCurrency: z.enum(['BOB', 'USD']),
})

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    await userPreferencesRepository.ensure(userId)
    const preferences = await userPreferencesRepository.get(userId)
    return NextResponse.json({ data: preferences })
  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = updatePreferencesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const preferences = await userPreferencesRepository.update(userId, parsed.data)
    return NextResponse.json({ data: preferences })
  } catch (error: unknown) {
    return handleError(error)
  }
}