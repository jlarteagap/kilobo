import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl flex flex-col items-center justify-between gap-6 sm:flex-row">
        <p className="text-sm text-neutral-500">
          © {new Date().getFullYear()} Kilo. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-6">
          <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            Privacidad
          </Link>
          <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            Términos
          </Link>
        </div>
      </div>
    </footer>
  )
}
