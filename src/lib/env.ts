// src/lib/env.ts
function getEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Variable de entorno faltante: ${key}`)
  return value
}
export const env = {
  firebaseProjectId: getEnvVar('FIREBASE_PROJECT_ID'),
  firebaseClientEmail: getEnvVar('FIREBASE_CLIENT_EMAIL'),
  firebasePrivateKey: getEnvVar('FIREBASE_PRIVATE_KEY'),
}