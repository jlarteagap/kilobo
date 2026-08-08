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
  Sparkles,
  PiggyBank,
  CarTaxiFront,
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
  { name: "Insights",         href: "/insights",     icon: Sparkles    },
  { name: "Metas de Ahorro",  href: "/ahorros",      icon: PiggyBank   },
  { name: "Conductor",        href: "/conductor",    icon: CarTaxiFront },
]

export function Sidebar({ ...props }: React.ComponentProps<typeof ShadcnSidebar>) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const { user, signOut } = useAuth()

  return (
    <ShadcnSidebar 
      collapsible="icon" 
      className="border-r border-[rgba(0,0,0,0.06)] bg-white"
      {...props}
    >
      <SidebarHeader className="h-16 flex flex-row items-center px-4 border-b border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3 font-semibold text-lg text-[#4F6A35]">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#5F7D42] text-white shadow-sm ring-1 ring-[#5F7D42]/20">
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
                      ? "bg-[#F2F9E3] text-[#4F6A35] shadow-sm ring-1 ring-[#5F7D42]/10" 
                      : "text-[#6E6E73] hover:bg-[#F2F9E3]"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className={cn(
                      "size-5 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-[#4F6A35]" : ""
                    )} />
                    <span className="font-medium">{item.name}</span>
                    {isActive ? (
                      <ChevronRight className="ml-auto size-4 text-[#5F7D42]/50" />
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-[rgba(0,0,0,0.06)]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-10 px-3 rounded-lg text-[#6E6E73] hover:bg-[#F2F9E3]"
              tooltip="Ajustes"
            >
              <Link href="/conductor/settings">
                <Settings className="size-5" />
                <span className="font-medium">Ajustes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-12 px-2 rounded-xl bg-[#F2F9E3] hover:bg-[#F2F9E3]"
              tooltip="Perfil"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F2F9E3] text-[#4F6A35] ring-1 ring-[#5F7D42]/10">
                <User className="size-4" />
              </div>
              <div className={cn(
                "flex flex-col gap-0.5 truncate transition-all duration-300",
                state === "collapsed" ? "opacity-0 invisible w-0" : "opacity-100 visible ml-2"
              )}>
                <span className="text-sm font-semibold text-foreground">{user?.displayName || "Usuario"}</span>
                <span className="text-xs text-[#6E6E73] truncate">{user?.email || "Sin email"}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="h-10 px-3 rounded-lg text-[#B5543D] hover:bg-[#FAEDE9]"
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
