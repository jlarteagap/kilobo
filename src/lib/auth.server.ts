import { cookies } from 'next/headers'
import { adminAuth } from './firebase.admin'

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value

  if (!sessionCookie) {
    return null
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    return decodedClaims.uid
  } catch (error) {
    console.error('Error verifying session cookie:', error)
    return null
  }
}

