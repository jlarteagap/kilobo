'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Si hay usuario y no está cargando, redirigir al dashboard
    if (!loading && user) {
      router.push('/transactions')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12 dark:bg-neutral-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl shadow-neutral-200/50 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:shadow-none dark:ring-neutral-800">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex aspect-square size-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600/20">
            <Wallet className="size-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Kilo
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Ingresa para gestionar tus finanzas
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <button
            onClick={signInWithGoogle}
            className="group relative flex w-full justify-center rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700/50 transition-all duration-200"
          >
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
            </span>
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  )
}
