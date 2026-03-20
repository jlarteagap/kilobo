"use client"

import { toast } from "sonner"
import { AccountForm } from "./AccountForm"
import { useCreateAccount } from "./hooks/useAccounts"
import type { CreateAccountData } from "@/types/account"

interface CreateAccountFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateAccountForm({ onSuccess, onCancel }: CreateAccountFormProps) {
  const createAccount = useCreateAccount()

  const handleCreate = (data: CreateAccountData) => {
    createAccount.mutate(data, {
      onSuccess: () => {
        toast.success('Cuenta creada correctamente')
        onSuccess()
      },
      onError: () => toast.error('Error al crear la cuenta'),
    })
  }

  return (
    <AccountForm 
      onSubmit={handleCreate} 
      onCancel={onCancel} 
      isPending={createAccount.isPending} 
    />
  )
}
