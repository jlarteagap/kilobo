"use client"

import AppLayout from "@/components/layout/AppLayout"
import { AccountsList } from "@/features/accounts/AccountsList"

export default function AccountsPage() {
  return (
    <AppLayout>
      <AccountsList />
    </AppLayout>
  )
}
