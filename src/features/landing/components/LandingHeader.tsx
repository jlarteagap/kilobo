import Link from 'next/link'
import { Wallet } from 'lucide-react'

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-neutral-50/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600/20">
            <Wallet className="size-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900">
            Kilo
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
          >
            Comenzar Gratis
          </Link>
        </nav>
      </div>
    </header>
  )
}
