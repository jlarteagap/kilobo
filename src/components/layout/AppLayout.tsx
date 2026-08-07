import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { BottomNav } from "./BottomNav"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <Sidebar aria-label="Navegación principal" />
        <SidebarInset className="flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {children}
          </main>
        </SidebarInset>
        <BottomNav />
      </div>
    </SidebarProvider>
  )
}
