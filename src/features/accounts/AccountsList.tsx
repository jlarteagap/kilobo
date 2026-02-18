"use client"

import { useState } from "react"
import { Account, CreateAccountData} from "@/types/account"
import { AccountForm } from "./AccountForm"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { toast } from 'sonner'

import { 
  getAccountIcon,
  getAccountIconColor,
  getTypeLabel,
  formatCurrency
} from "@/features/accounts/utils/account-display.utils"
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from "@/features/accounts/hooks/useAccounts"
// import { useToast } from "@/hooks/use-toast"

export function AccountsList() {
  const { data: accounts = [], isLoading, isError } = useAccounts()


  const { mutate: createAccount, isPending: isCreating } = useCreateAccount()
  const { mutate: updateAccount, isPending: isUpdating } = useUpdateAccount()
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined)

  const handleAddAccount = (data: CreateAccountData) => {
  createAccount(data, {
    onSuccess: () => {setIsDialogOpen(false), toast.success("Cuenta agregada exitosamente")},
    onError: () => {toast.error("Error al agregar la cuenta")},
  })
}

const handleEditAccount = (data: CreateAccountData) => {
  if (!editingAccount?.id) return
  updateAccount({ id: editingAccount.id, data }, {
    onSuccess: () => {setIsDialogOpen(false), toast.success("Cuenta actualizada exitosamente")},
    onError: () => {toast.error("Error al actualizar la cuenta")},
  })
}

const handleDeleteAccount = (id: string) => {
  deleteAccount(id, {
    onSuccess: () => {toast.success("Cuenta eliminada exitosamente")},
    onError: () => {toast.error("Error al eliminar la cuenta")},
  })
}

  const openAddModal = () => {
    setEditingAccount(undefined)
    setIsDialogOpen(true)
  }

  const openEditModal = (account: Account) => {
    setEditingAccount(account)
    setIsDialogOpen(true)
  }

  
  if (isLoading) {
      return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-emerald-600"/></div>
  }

  if (isError) {
      return <div className="text-red-500 text-center p-10">{isError}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold tracking-tight text-gray-900">Mis Cuentas</h2>
           <p className="text-gray-500">Gestiona tus cuentas bancarias, efectivo y billeteras.</p>
        </div>
        <Button onClick={openAddModal} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Nueva Cuenta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No hay cuentas registradas. Crea tu primera cuenta para comenzar.
          </div>
        ) : (
          accounts.map((account) => {
            const Icon = getAccountIcon(account.type)
            return (
              <Card key={account.id} className="relative overflow-hidden transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-full ${getAccountIconColor(account.type)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(account)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-red-600"
                          disabled={isDeleting}
                        >
                          {isDeleting 
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            : <Trash2 className="mr-2 h-4 w-4" />
                          }
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{account.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{getTypeLabel(account.type)}</p>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(account.balance, account.currency)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar Cuenta" : "Nueva Cuenta"}</DialogTitle>
             <DialogDescription>
              {editingAccount ? "Modifica los detalles de la cuenta existente." : "Ingresa los detalles para la nueva cuenta."}
            </DialogDescription>
          </DialogHeader>
          <AccountForm 
            initialData={editingAccount}
            onSubmit={editingAccount ? handleEditAccount : handleAddAccount}
            onCancel={() => setIsDialogOpen(false)}
            isPending={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
