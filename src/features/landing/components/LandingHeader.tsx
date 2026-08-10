import Link from 'next/link'
import { Wallet } from 'lucide-react'

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(0,0,0,0.06)] bg-[#F2FBE0]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#4F6A35] text-white shadow-sm ring-1 ring-[#4F6A35]/20">
            <Wallet className="size-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Kilo
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-[#6E6E73] transition-colors hover:text-foreground"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-[#4F6A35] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3C5230]"
          >
            Comenzar Gratis
          </Link>
        </nav>
      </div>
    </header>
  )
}
