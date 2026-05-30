'use client'

import { useState } from 'react'
import { useSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal } from '../hooks/useSavingsGoals'
import { SavingsGoalCard } from './SavingsGoalCard'
import { SavingsGoalForm } from './SavingsGoalForm'
import type { SavingsGoal } from '@/types/savings-goal'
import type { CreateSavingsGoalInput } from '@/lib/validations/savings-goal.schema'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Plus, PiggyBank } from 'lucide-react'

export function SavingsGoalsList() {
  const { data: goals = [], isLoading } = useSavingsGoals()
  const { data: accounts = [] } = useAccounts()
  const createMutation = useCreateSavingsGoal()
  const updateMutation = useUpdateSavingsGoal()
  const deleteMutation = useDeleteSavingsGoal()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)

  const activeGoals = goals.filter(g => g.is_active)
  const archivedGoals = goals.filter(g => !g.is_active)

  const handleCreate = (data: CreateSavingsGoalInput) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    })
  }

  const handleUpdate = (data: CreateSavingsGoalInput) => {
    if (!editingGoal) return
    updateMutation.mutate({ id: editingGoal.id, data }, {
      onSuccess: () => {
        setEditingGoal(null)
        setIsFormOpen(false)
      },
    })
  }

  const handleArchive = (goal: SavingsGoal) => {
    updateMutation.mutate({ id: goal.id, data: { is_active: false } })
  }

  const handleDelete = (goal: SavingsGoal) => {
    deleteMutation.mutate(goal.id)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Metas de Ahorro</h1>
          <p className="text-sm text-muted-foreground">
            {activeGoals.length} meta{activeGoals.length !== 1 ? 's' : ''} activa{activeGoals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => { setEditingGoal(null); setIsFormOpen(true) }}
          className="rounded-xl h-11 px-5 gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva meta
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="w-10 h-10" />}
          title="Sin metas de ahorro"
          description="Crea tu primera meta para empezar a ahorrar con propósito."
          action={
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear primera meta
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="mb-6">
            <TabsTrigger value="active">Activas ({activeGoals.length})</TabsTrigger>
            <TabsTrigger value="archived">Archivadas ({archivedGoals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeGoals.map(goal => (
              <SavingsGoalCard
                key={goal.id}
                goal={goal}
                onEdit={(g) => { setEditingGoal(g); setIsFormOpen(true) }}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </TabsContent>

          <TabsContent value="archived" className="space-y-4">
            {archivedGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay metas archivadas</p>
            ) : (
              archivedGoals.map(goal => (
                <SavingsGoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={(g) => { setEditingGoal(g); setIsFormOpen(true) }}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setIsFormOpen(false); setEditingGoal(null) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Editar meta' : 'Nueva meta de ahorro'}</DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Actualiza los detalles de tu meta.' : 'Define una meta de ahorro para mantenerte motivado.'}
            </DialogDescription>
          </DialogHeader>
          <SavingsGoalForm
            goal={editingGoal}
            accounts={accounts}
            onSubmit={editingGoal ? handleUpdate : handleCreate}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
