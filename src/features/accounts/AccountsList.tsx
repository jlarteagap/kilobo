"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Plus, Pencil, Trash2, Wallet, Landmark, Banknote, Bitcoin, CircleEllipsis, Loader2, CreditCard } from "lucide-react"
import { Account, ACCOUNT_TYPES } from "@/types/account"
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
import { accountsService } from "@/services/accounts.service"
// import { useToast } from "@/hooks/use-toast"

export function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined)
  // const { toast } = useToast() 

  // Fetch accounts on component mount
  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      setError(null)
      const accounts = await accountsService.getAccounts()
      setAccounts(accounts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las cuentas')
      console.error('Error loading accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccount = async (newAccount: Account) => {
    try {
      const created = await accountsService.create(newAccount)
      setAccounts(prev => [created, ...prev])
      setIsDialogOpen(false)
    } catch (err) {
      console.error('Error adding account:', err)
    }
  }

  const handleEditAccount = async (updatedAccount: Account) => {
    try {
      if (!updatedAccount.id) return
      await accountsService.update(updatedAccount.id, updatedAccount)
      setAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc))
      setIsDialogOpen(false)
    } catch (err) {
      console.error('Error updating account:', err)
    }
  }

  const handleDeleteAccount = async (id: string) => {
    try {
      await accountsService.delete(id)
      setAccounts(prev => prev.filter(acc => acc.id !== id))
    } catch (err) {
      console.error('Error deleting account:', err)
    }
  }

  const openAddModal = () => {
    setEditingAccount(undefined)
    setIsDialogOpen(true)
  }

  const openEditModal = (account: Account) => {
    setEditingAccount(account)
    setIsDialogOpen(true)
  }

  const getIcon = (type: string) => {
    switch (type) {
        case "BANK": return Landmark;
        case "WALLET": return Wallet;
        case "CASH": return Banknote;
        case "CRYPTO": return Bitcoin;
        case "DEBT": return CreditCard;
        default: return CircleEllipsis;
    }
  }

  const getTypeLabel = (type: string) => {
    return ACCOUNT_TYPES.find(t => t.value === type)?.label || type
  }
  
  const getIconColor = (type: string) => {
    switch (type) {
      case "DEBT": return "bg-orange-100 text-orange-600";
      default: return "bg-emerald-100 text-emerald-600";
    }
  }
  
  if (loading) {
      return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-emerald-600"/></div>
  }

  if (error) {
      return <div className="text-red-500 text-center p-10">{error}</div>
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
            const Icon = getIcon(account.type)
            return (
              <Card key={account.id} className="relative overflow-hidden transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-full ${getIconColor(account.type)}`}>
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
                        <DropdownMenuItem onClick={() => account.id && handleDeleteAccount(account.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{account.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{getTypeLabel(account.type)}</p>
                    <div className="text-2xl font-bold text-gray-900">
                      ${account.balance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {account.currency}
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
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
