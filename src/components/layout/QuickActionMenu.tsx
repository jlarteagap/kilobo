"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Plus, ArrowRightLeft, Landmark, PieChart, Tag, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

// Dynamically import forms to prevent bloating the initial bundle
const TransactionForm = dynamic(
  () => import("@/features/transactions/TransactionForm").then((mod) => mod.TransactionForm),
  { ssr: false }
)
const AccountForm = dynamic(
  () => import("@/features/accounts/CreateAccountForm").then((mod) => mod.CreateAccountForm),
  { ssr: false }
)
const BudgetForm = dynamic(
  () => import("@/features/budgets/BudgetForm").then((mod) => mod.BudgetForm),
  { ssr: false }
)
const CategoryForm = dynamic(
  () => import("@/features/categories/components/CategoryForm").then((mod) => mod.CategoryForm),
  { ssr: false }
)
const DebtForm = dynamic(
  () => import("@/features/debts/DebtForm").then((mod) => mod.DebtForm),
  { ssr: false }
)

type ActionType = "TRANSACTION" | "ACCOUNT" | "BUDGET" | "CATEGORY" | "DEBT" | null

export function QuickActionMenu() {
  const [actionType, setActionType] = useState<ActionType>(null)
  
  const handleClose = () => setActionType(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm rounded-full transition-all duration-200 active:scale-95">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl border-neutral-200/50 shadow-lg dark:border-neutral-800/50">
          <DropdownMenuLabel className="font-medium text-neutral-500">Crear rápido</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setActionType("TRANSACTION")} className="gap-3 cursor-pointer py-2 rounded-lg focus:bg-emerald-50 focus:text-emerald-900 dark:focus:bg-emerald-900/30 dark:focus:text-emerald-100 transition-colors">
            <ArrowRightLeft className="h-4 w-4" />
            <span>Transacción</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActionType("ACCOUNT")} className="gap-3 cursor-pointer py-2 rounded-lg transition-colors">
            <Landmark className="h-4 w-4" />
            <span>Cuenta</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActionType("BUDGET")} className="gap-3 cursor-pointer py-2 rounded-lg transition-colors">
            <PieChart className="h-4 w-4" />
            <span>Presupuesto</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActionType("CATEGORY")} className="gap-3 cursor-pointer py-2 rounded-lg transition-colors">
            <Tag className="h-4 w-4" />
            <span>Categoría</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActionType("DEBT")} className="gap-3 cursor-pointer py-2 rounded-lg transition-colors">
            <CreditCard className="h-4 w-4" />
            <span>Deuda</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={actionType !== null} onOpenChange={(open) => { if (!open) handleClose() }}>
        {actionType && (
          <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden border-neutral-200/50 shadow-xl dark:border-neutral-800/50 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              <DialogTitle className="text-xl font-semibold">
                {actionType === "TRANSACTION" && "Nueva Transacción"}
                {actionType === "ACCOUNT" && "Nueva Cuenta"}
                {actionType === "BUDGET" && "Nuevo Presupuesto"}
                {actionType === "CATEGORY" && "Nueva Categoría"}
                {actionType === "DEBT" && "Registrar Deuda"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {actionType === "TRANSACTION" && "Registra un ingreso, gasto o transferencia."}
                {actionType === "ACCOUNT" && "Añade una nueva cuenta para controlar tu dinero."}
                {actionType === "BUDGET" && "Define un nuevo límite o meta de gasto."}
                {actionType === "CATEGORY" && "Organiza tus movimientos en una nueva categoría."}
                {actionType === "DEBT" && "Registra préstamos realizados o recibidos."}
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              {actionType === "TRANSACTION" && <TransactionForm onSuccess={handleClose} />}
              {actionType === "ACCOUNT" && (
                <AccountForm 
                  onSuccess={handleClose}
                  onCancel={handleClose} 
                />
              )}
              {actionType === "BUDGET" && <BudgetForm onSuccess={handleClose} />}
              {actionType === "CATEGORY" && <CategoryForm onSuccess={handleClose} />}
              {actionType === "DEBT" && <DebtForm onSuccess={handleClose} />}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
