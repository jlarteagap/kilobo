import { savingsGoalRepository } from '@/repositories/savings-goal.repository'
import { accountsRepository } from '@/repositories/accounts.repository'
import { transactionService } from '@/services/transactions.service'
import { convertToBOB, getExchangeRate } from '@/lib/config/exchange-rates'
import type { SavingsGoal, CreateSavingsGoalData, UpdateSavingsGoalData } from '@/types/savings-goal'
import type { DepositSavingsGoalInput } from '@/lib/validations/savings-goal.schema'
import type { CreateTransactionData } from '@/types/transaction'

const MAX_ACTIVE_GOALS = 20

export const savingsGoalService = {
  async getGoals(userId: string): Promise<SavingsGoal[]> {
    return savingsGoalRepository.findAll(userId)
  },

  async getGoal(id: string, userId: string): Promise<SavingsGoal | null> {
    return savingsGoalRepository.findById(id, userId)
  },

  async createGoal(data: CreateSavingsGoalData, userId: string): Promise<SavingsGoal> {
    const existing = await savingsGoalRepository.findAll(userId)
    const activeCount = existing.filter(g => g.is_active).length

    if (activeCount >= MAX_ACTIVE_GOALS) {
      throw new Error(`No puedes tener más de ${MAX_ACTIVE_GOALS} metas activas. Archiva una para crear otra.`)
    }

    return savingsGoalRepository.create(data, userId)
  },

  async updateGoal(id: string, data: UpdateSavingsGoalData, userId: string): Promise<SavingsGoal> {
    const goal = await savingsGoalRepository.findById(id, userId)
    if (!goal) throw new Error('Meta no encontrada o no autorizada.')

    if (data.current_amount !== undefined && data.current_amount > goal.target_amount) {
      throw new Error('El monto actual no puede superar la meta.')
    }

    return savingsGoalRepository.update(id, data)
  },

  async deleteGoal(id: string, userId: string): Promise<void> {
    const goal = await savingsGoalRepository.findById(id, userId)
    if (!goal) throw new Error('Meta no encontrada o no autorizada.')

    return savingsGoalRepository.delete(id)
  },

  /**
   * Registra un depósito: crea una transacción EXPENSE real (descuenta saldo
   * de la cuenta) y acredita el monto en la meta. Si la cuenta es de otra
   * moneda, el débito se convierte vía BOB para no mezclar numerarios.
   * Devuelve la meta actualizada, la transacción creada y si cruzó el 100%.
   */
  async deposit(
    id: string,
    data: DepositSavingsGoalInput,
    userId: string
  ): Promise<{ goal: SavingsGoal; transaction: unknown; completed: boolean }> {
    const goal = await savingsGoalRepository.findById(id, userId)
    if (!goal) throw new Error('Meta no encontrada o no autorizada.')
    if (!goal.is_active) throw new Error('No puedes depositar en una meta archivada.')

    const remaining = goal.target_amount - goal.current_amount
    if (data.amount > remaining) {
      throw new Error('El depósito supera lo que falta para completar la meta.')
    }

    const sourceAccount = await accountsRepository.findById(data.account_id, userId)
    if (!sourceAccount) throw new Error('Cuenta no encontrada.')

    // Débito en moneda de la cuenta cuando difiere de la moneda de la meta
    let debitAmount = data.amount
    if (sourceAccount.currency !== goal.currency) {
      debitAmount = Number(
        (convertToBOB(data.amount, goal.currency) / getExchangeRate(sourceAccount.currency)).toFixed(2)
      )
    }

    const txData: CreateTransactionData = {
      account_id: data.account_id,
      type: 'EXPENSE',
      amount: debitAmount,
      date: data.date ?? new Date().toISOString().slice(0, 10),
      description: `Ahorro: ${goal.name}`,
      currency: goal.currency,
      subtype: 'ahorro',
    }

    const transaction = await transactionService.createWithBalance(txData, userId)

    const updated = await savingsGoalRepository.deposit(id, data.amount)
    const completed = updated.current_amount >= updated.target_amount

    return { goal: updated, transaction, completed }
  },
}
