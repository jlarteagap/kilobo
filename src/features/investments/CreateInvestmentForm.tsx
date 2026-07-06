"use client"

import { toast } from "sonner"
import { InvestmentForm } from "./InvestmentForm"
import { useCreateInvestment } from "./hooks/useInvestments"
import { useAccounts } from "@/features/accounts/hooks/useAccounts"
import type { CreateInvestmentData } from "@/types/investment"
import type { CreateInvestmentInput } from "@/lib/validations/investment.schema"

interface CreateInvestmentFormProps {
  preselectedAccountId?: string
  onSuccess: () => void
  onCancel: () => void
}

export function CreateInvestmentForm({
  preselectedAccountId,
  onSuccess,
  onCancel,
}: CreateInvestmentFormProps) {
  const { data: accounts = [] } = useAccounts()
  const createInvestment = useCreateInvestment()

  const handleCreate = (data: CreateInvestmentInput) => {
    createInvestment.mutate(data as CreateInvestmentData, {
      onSuccess: () => {
        toast.success('Inversión registrada correctamente')
        onSuccess()
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <InvestmentForm
      accounts={accounts}
      preselectedAccountId={preselectedAccountId}
      onSubmit={handleCreate}
      onCancel={onCancel}
      isPending={createInvestment.isPending}
    />
  )
}
