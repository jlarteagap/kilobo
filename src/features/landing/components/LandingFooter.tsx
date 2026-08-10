import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="border-t border-[rgba(0,0,0,0.06)] bg-[#F2FBE0] px-4 py-12 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl flex flex-col items-center justify-between gap-6 sm:flex-row">
        <p className="text-sm text-[#6E6E73]">
          © {new Date().getFullYear()} Kilo. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-6">
          <Link href="#" className="text-sm text-[#6E6E73] hover:text-foreground transition-colors">
            Privacidad
          </Link>
          <Link href="#" className="text-sm text-[#6E6E73] hover:text-foreground transition-colors">
            Términos
          </Link>
        </div>
      </div>
    </footer>
  )
}
