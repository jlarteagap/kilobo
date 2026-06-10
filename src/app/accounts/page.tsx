"use client"

import AppLayout from "@/components/layout/AppLayout"
import { AccountsList } from "@/features/accounts/AccountsList"
import { ProjectsList } from "@/features/projects/ProjectsList"

export default function AccountsPage() {
  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-8 px-4 md:px-6">
          {/* Columna Principal: Cuentas */}
          <div className="lg:col-span-8 space-y-12">
            <AccountsList />
          </div>

          {/* Columna Lateral: Actividades */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="sticky top-24">
              <ProjectsList isSidebar />
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  )
}
