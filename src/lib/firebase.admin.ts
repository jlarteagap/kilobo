import {initializeApp, getApps, cert} from 'firebase-admin/app'
import {getFirestore} from 'firebase-admin/firestore'
import {getAuth} from 'firebase-admin/auth'

const formatPrivateKey = (key: string | undefined): string | undefined => {
  if (!key) return undefined
  // Elimina comillas envolventes adicionales y espacios en blanco
  const cleaned = key.trim().replace(/^["']|["']$/g, '')
  // Reemplaza los \n literales por saltos de línea reales
  return cleaned.replace(/\\n/g, '\n')
}

const adminApp = getApps().length === 0
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
      }),
    })
  : getApps()[0]

export const adminDb = getFirestore(adminApp)
export const adminAuth = getAuth(adminApp)