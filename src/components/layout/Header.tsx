"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Bienvenido de nuevo, Jorge
        </h1>
        <p className="text-sm text-gray-500">
          Aquí está el resumen financiero de hoy.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md">
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
