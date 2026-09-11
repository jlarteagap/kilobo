"use client"


import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { QuickActionMenu } from "@/components/layout/QuickActionMenu"
import { usePathname } from "next/navigation"

const ROUTE_TITLES: Record<string, string> = {
  "/":            "Dashboard",
  "/dashboard":   "Dashboard",
  "/accounts":    "Cuentas",
  "/transactions": "Transacciones",
  "/debts":       "Deudas y Préstamos",
  "/budgets":     "Presupuestos",
  "/categories":  "Categorías",
  "/insights":    "Insights",
  "/ahorros":     "Metas de Ahorro",
  "/ajustes":     "Ajustes",
  "/conductor":   "Conductor",
  "/conductor/settings": "Ajustes",
  "/conductor/analytics": "Conductor",
}

export function Header() {
  const { user } = useAuth()
  const pathname = usePathname()

  const initials = user?.displayName 
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : "U"

  // Longest-prefix match so subroutes fall back to their section title
  const title = Object.entries(ROUTE_TITLES)
    .filter(([route]) => pathname === route || (route !== "/" && pathname.startsWith(route)))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "Dashboard"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-white/80 px-4 md:px-6 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-4">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <h1 className="truncate text-[30px] font-extrabold tracking-tight text-foreground">{title}</h1>
      </div>
      
      <div className="flex shrink-0 items-center gap-3">
        <QuickActionMenu />
        <Avatar className="size-8 ring-2 ring-[#F2F9E3]">
          <AvatarImage src={user?.photoURL || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
