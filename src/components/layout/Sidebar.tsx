"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CreditCard, PieChart, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Cuentas", href: "/accounts", icon: Wallet },
  { name: "Transacciones", href: "/transactions", icon: CreditCard },
  { name: "Presupuestos", href: "/budgets", icon: PieChart },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full w-20 md:w-64 border-r bg-white shadow-sm">
      <div className="flex h-16 items-center justify-center border-b">
        <div className="flex items-center gap-2 font-bold text-xl text-emerald-600">
           <Wallet className="h-6 w-6" />
           <span className="hidden md:block">Kilo</span>
        </div>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900",
                isActive ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800" : "text-gray-500"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="hidden md:block">{item.name}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t">
        <p className="text-xs text-center text-gray-400">
          <span className="hidden md:block">© 2026 Kilo Finance</span>
        </p>
      </div>
    </div>
  )
}
