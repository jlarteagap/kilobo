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
        <div className="p-3 rounded-2xl bg-[#FAEDE9]">
          <AlertTriangle className="h-8 w-8 text-[#B5543D]" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Algo salió mal
        </h2>
        <p className="text-sm text-[#6E6E73] leading-relaxed">
          Ocurrió un error inesperado. Puedes intentar recargar esta página o volver al inicio.
        </p>
        {error.digest && (
          <p className="text-[11px] text-[#6E6E73]/60 font-mono">
            Error: {error.digest}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <Button
            onClick={reset}
            className="gap-2 rounded-xl bg-[#4F6A35] hover:bg-[#3C5230] text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgba(0,0,0,0.08)] text-sm font-medium text-[#6E6E73] hover:bg-[#F2F9E3] transition-colors"
          >
            <Home className="h-4 w-4" />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
