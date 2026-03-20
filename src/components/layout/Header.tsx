"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { QuickActionMenu } from "@/components/layout/QuickActionMenu"

export function Header() {
  const { user } = useAuth()
  
  const firstName = user?.displayName?.split(' ')[0] || "Invitado"
  const initials = user?.displayName 
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : "U"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200/50 bg-white/70 px-4 md:px-6 backdrop-blur-xl dark:border-neutral-800/50 dark:bg-neutral-900/70">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Bienvenido, {firstName}
          </h1>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <QuickActionMenu />
        <Avatar className="size-8 ring-2 ring-neutral-100 dark:ring-neutral-800">
          <AvatarImage src={user?.photoURL || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
