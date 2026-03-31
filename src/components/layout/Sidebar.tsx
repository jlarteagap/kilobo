"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  CreditCard,
  PieChart,
  Wallet,

  HandCoins,    // ← para Deudas
  LayoutGrid,   // ← para Categorías
  ChevronRight,
  User,
  Settings,
  LogOut,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

const navigation = [
  { name: "Dashboard",        href: "/",            icon: Home        },
  { name: "Cuentas",          href: "/accounts",    icon: Wallet      },
  { name: "Transacciones",    href: "/transactions", icon: CreditCard },
  { name: "Deudas y Préstamos", href: "/debts",     icon: HandCoins   },
  { name: "Presupuestos",     href: "/budgets",      icon: PieChart    },
  { name: "Categorías",       href: "/categories",   icon: LayoutGrid  },
]

export function Sidebar({ ...props }: React.ComponentProps<typeof ShadcnSidebar>) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const { user, signOut } = useAuth()

  return (
    <ShadcnSidebar 
      collapsible="icon" 
      className="border-r border-neutral-200/50 bg-white/70 backdrop-blur-xl dark:border-neutral-800/50 dark:bg-neutral-900/70"
      {...props}
    >
      <SidebarHeader className="h-16 flex flex-row items-center px-4 border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="flex items-center gap-3 font-semibold text-lg text-emerald-600">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600/20">
            <Wallet className="size-5" />
          </div>
          <span className={cn(
            "transition-all duration-300",
            state === "collapsed" ? "opacity-0 invisible w-0" : "opacity-100 visible"
          )}>
            Kilo
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 pt-4">
        <SidebarMenu>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                  className={cn(
                    "relative group h-10 px-3 transition-all duration-200 rounded-lg",
                    isActive 
                      ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-600/10 dark:bg-emerald-950/30 dark:text-emerald-400" 
                      : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/50"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className={cn(
                      "size-5 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-emerald-600" : ""
                    )} />
                    <span className="font-medium">{item.name}</span>
                    {isActive ? (
                      <ChevronRight className="ml-auto size-4 text-emerald-600/50" />
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-10 px-3 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/50"
              tooltip="Ajustes"
            >
              <Settings className="size-5" />
              <span className="font-medium">Ajustes</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-12 px-2 rounded-xl bg-neutral-100/50 hover:bg-neutral-100 dark:bg-neutral-800/30 dark:hover:bg-neutral-800/50"
              tooltip="Perfil"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <User className="size-4" />
              </div>
              <div className={cn(
                "flex flex-col gap-0.5 truncate transition-all duration-300",
                state === "collapsed" ? "opacity-0 invisible w-0" : "opacity-100 visible ml-2"
              )}>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{user?.displayName || "Usuario"}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user?.email || "Sin email"}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="h-10 px-3 rounded-lg text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              tooltip="Cerrar sesión"
            >
              <LogOut className="size-5" />
              <span className="font-medium">Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  )
}
