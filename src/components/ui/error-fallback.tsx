"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

interface ErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="p-3 rounded-2xl bg-rose-50">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Algo salió mal
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Ocurrió un error inesperado. Puedes intentar recargar esta página o volver al inicio.
        </p>
        {error.digest && (
          <p className="text-[11px] text-gray-300 font-mono">
            Error: {error.digest}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <Button
            onClick={reset}
            className="gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Home className="h-4 w-4" />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
