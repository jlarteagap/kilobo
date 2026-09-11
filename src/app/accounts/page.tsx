"use client"

import AppLayout from "@/components/layout/AppLayout"
import { AccountsList } from "@/features/accounts/AccountsList"
import { ProjectsList } from "@/features/projects/ProjectsList"
import { InvestmentsList } from "@/features/investments/InvestmentsList"
import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

type Tab = "accounts" | "investments"

function AccountsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = searchParams.get("tab") === "investments" ? "investments" : "accounts"
  const [tab, setTab] = useState<Tab>(initialTab)
  const { data: accounts = [] } = useAccounts()

  const changeTab = (next: Tab) => {
    setTab(next)
    router.replace(next === "investments" ? "/accounts?tab=inversiones" : "/accounts", { scroll: false })
  }

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-8 px-4 md:px-6">
          {/* Columna Principal */}
          <div className="lg:col-span-8 space-y-12">
            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1 w-fit">
              <button
                onClick={() => changeTab("accounts")}
                className={cn(
                  "px-4 py-2 rounded-lg text-[12px] font-bold transition-all duration-200",
                  tab === "accounts"
                    ? "bg-white border border-zinc-200 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                Cuentas
              </button>
              <button
                onClick={() => changeTab("investments")}
                className={cn(
                  "px-4 py-2 rounded-lg text-[12px] font-bold transition-all duration-200",
                  tab === "investments"
                    ? "bg-white border border-zinc-200 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900"
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

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 py-8 px-4 md:px-6">
            <div className="lg:col-span-8 space-y-12">
              <div className="h-10 w-40 animate-pulse bg-zinc-100 rounded-xl" />
              <div className="h-64 animate-pulse bg-zinc-100 rounded-2xl" />
            </div>
            <aside className="lg:col-span-4 space-y-8">
              <div className="h-64 animate-pulse bg-zinc-100 rounded-2xl" />
            </aside>
          </div>
        </AppLayout>
      }
    >
      <AccountsContent />
    </Suspense>
  )
}
