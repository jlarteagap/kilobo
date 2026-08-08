"use client"

import AppLayout from "@/components/layout/AppLayout"
import { AccountsList } from "@/features/accounts/AccountsList"
import { ProjectsList } from "@/features/projects/ProjectsList"
import { InvestmentsList } from "@/features/investments/InvestmentsList"
import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { cn } from "@/lib/utils"
import { useState } from "react"

type Tab = "accounts" | "investments"

export default function AccountsPage() {
  const [tab, setTab] = useState<Tab>("accounts")
  const { data: accounts = [] } = useAccounts()

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-8 px-4 md:px-6">
          {/* Columna Principal */}
          <div className="lg:col-span-8 space-y-12">
            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 bg-[#F2F9E3] rounded-xl p-1 w-fit">
              <button
                onClick={() => setTab("accounts")}
                className={cn(
                  "px-4 py-2 rounded-lg text-[12px] font-bold transition-all duration-200",
                  tab === "accounts"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-[#6E6E73] hover:text-foreground"
                )}
              >
                Cuentas
              </button>
              <button
                onClick={() => setTab("investments")}
                className={cn(
                  "px-4 py-2 rounded-lg text-[12px] font-bold transition-all duration-200",
                  tab === "investments"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-[#6E6E73] hover:text-foreground"
                )}
              >
                Inversiones
              </button>
            </div>

            {tab === "accounts" ? (
              <AccountsList />
            ) : (
              <InvestmentsList accounts={accounts} />
            )}
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
