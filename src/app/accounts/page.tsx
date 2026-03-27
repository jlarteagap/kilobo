"use client"

import AppLayout from "@/components/layout/AppLayout"
import { AccountsList } from "@/features/accounts/AccountsList"
import { ProjectsList } from "@/features/projects/ProjectsList"

export default function AccountsPage() {
  return (
    <AppLayout>
    <div className="space-y-20 p-6 md:p-10">
      <AccountsList />

      {/* ── Divisor ── */}
      <div className="h-px bg-neutral-100 dark:bg-neutral-800/50" />

      <ProjectsList />
    </div>
    </AppLayout>
  )
}
