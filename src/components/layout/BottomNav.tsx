"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Wallet, ArrowRightLeft, User, Plus, Settings, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { QuickActionMenu } from "@/components/layout/QuickActionMenu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const NAV_ITEMS = [
  { name: "Inicio",       href: "/",             icon: Home },
  { name: "Cuentas",      href: "/accounts",     icon: Wallet },
]

export function BottomNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-[#E5DED2] bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-center px-2 pt-1.5">
        {/* Slots 1-2 */}
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center gap-0.5 py-1.5"
            >
              <item.icon
                className={cn(
                  "size-5 transition-colors",
                  isActive ? "text-[#4F6A35]" : "text-[#837A75]"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-[#4F6A35]" : "text-[#837A75]"
                )}
              >
                {item.name}
              </span>
            </Link>
          )
        })}

        {/* Central "+" (opens QuickActionMenu) */}
        <div className="flex justify-center">
          <QuickActionMenu
            trigger={
              <button
                type="button"
                aria-label="Crear nuevo"
                className="flex size-14 -mt-5 items-center justify-center rounded-full bg-[#5F7D42] text-white shadow-lg shadow-[#5F7D42]/30 ring-4 ring-white transition-transform active:scale-95"
              >
                <Plus className="size-6" />
              </button>
            }
          />
        </div>

        {/* Slot 4: Transacciones */}
        <Link
          href="/transactions"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1.5",
            pathname === "/transactions" ? "text-[#4F6A35]" : "text-[#837A75]"
          )}
        >
          <ArrowRightLeft className="size-5" />
          <span className="text-[10px] font-medium">Transacciones</span>
        </Link>

        {/* Slot 5: Perfil (dropdown) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex flex-col items-center gap-0.5 py-1.5 text-[#837A75]"
            >
              <User className="size-5" />
              <span className="text-[10px] font-medium">Perfil</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            sideOffset={8}
            className="w-64 rounded-[1.25rem] border-[#E5DED2] p-2"
          >
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="size-10 ring-2 ring-[#F2F9E3]">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-black">
                  {user?.displayName || "Usuario"}
                </p>
                <p className="truncate text-xs text-[#837A75]">
                  {user?.email || "Sin email"}
                </p>
              </div>
            </div>
            <div className="mt-1 flex flex-col gap-0.5 border-t border-[#E5DED2] pt-1.5">
              <Link
                href="/conductor/settings"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-black hover:bg-[#F2F9E3]"
              >
                <Settings className="size-4 text-[#837A75]" />
                Ajustes
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#B5543D] hover:bg-[#FAEDE9]"
              >
                <LogOut className="size-4" />
                Cerrar sesión
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
