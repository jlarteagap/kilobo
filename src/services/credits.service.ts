import { adminDb } from '@/lib/firebase.admin'
import { creditsRepository } from '@/repositories/credits.repository'
import { transactionService } from '@/services/transactions.service'
import { generateAmortization } from '@/lib/amortization'
import type { CreateCreditInput } from '@/lib/validations/credit.schema'
import { CREDIT_TYPES } from '@/types/credit'
import type { Credit, Installment } from '@/types/credit'

export const creditsService = {
  async getCredits(userId: string): Promise<Credit[]> {
    return creditsRepository.findAll(userId)
  },

  async getCreditDetail(id: string, userId: string): Promise<{ credit: Credit; installments: Installment[] }> {
    const credit = await creditsRepository.findById(id, userId)
    if (!credit) throw new Error('Crédito no encontrado o no autorizado.')
    const installments = await creditsRepository.findInstallments(id)
    return { credit, installments }
  },

  async createCredit(data: CreateCreditInput, userId: string): Promise<Credit> {
    const hasHistory = data.has_history ?? false

    // ── Determine values ──────────────────────────────────────────────────────
    const originalAmount = data.original_amount
    const currentBalance = data.current_balance ?? originalAmount
    const paidInstallments = data.paid_installments ?? 0
    let totalInstallments: number

    if (hasHistory) {
      totalInstallments = data.total_installments + paidInstallments
    } else {
      totalInstallments = data.total_installments
    }

    // ── Build create payload ──────────────────────────────────────────────────
    const createData = {
      type: data.type,
      institution: data.institution,
      original_amount: originalAmount,
      disbursed_amount: data.disbursed_amount ?? originalAmount,
      currency: data.currency,
      annual_interest_rate: data.annual_interest_rate,
      total_installments: totalInstallments,
      paid_installments: paidInstallments,
      current_balance: currentBalance,
      start_date: data.start_date,
      first_payment_date: data.first_payment_date,
      account_id: data.account_id ?? null,
      disburse_recorded: data.disburse_recorded ?? true,
      notes: data.notes ?? null,
    }

    // ── Create credit document ────────────────────────────────────────────────
    const credit = await creditsRepository.create(createData, userId)

    // ── Generate installments ─────────────────────────────────────────────────
    const futureTerm = hasHistory ? totalInstallments - paidInstallments : totalInstallments

    if (futureTerm > 0 && currentBalance > 0) {
      const rows = generateAmortization({
        balance: currentBalance,
        annualRate: data.annual_interest_rate,
        totalInstallments: futureTerm,
        firstPaymentDate: data.first_payment_date,
        monthlyPayment: data.monthly_payment,
      })

      const installments = rows.map((row) => ({
        credit_id: credit.id,
        number: row.number + (hasHistory ? paidInstallments : 0),
        due_date: row.due_date,
        total_amount: row.total_amount,
        principal: row.principal,
        interest: row.interest,
        remaining_balance: row.remaining_balance,
        status: 'PENDING' as const,
        paid_at: null,
        transaction_id: null,
      }))

      await creditsRepository.createInstallments(credit.id, installments)
    }

    // ── Disbursement transaction ──────────────────────────────────────────────
    if (data.account_id && data.disburse_recorded !== false) {
      await transactionService.createWithBalance({
        account_id: data.account_id,
        type: 'INCOME',
        amount: data.disbursed_amount ?? originalAmount,
        currency: data.currency,
        date: data.start_date,
        description: `Desembolso: ${data.institution} (${data.type})`,
        subtype: 'Crédito',
        status: 'COMPLETED',
      }, userId)
    }

    return credit
  },

  async cancelCredit(id: string, userId: string): Promise<Credit> {
    const credit = await creditsRepository.findById(id, userId)
    if (!credit) throw new Error('Crédito no encontrado o no autorizado.')
    if (credit.status === 'PAID') throw new Error('El crédito ya está pagado.')

    const installments = await creditsRepository.findInstallments(id)
    const pendingIds = installments
      .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
      .map((i) => i.id)

    const batch = adminDb.batch()
    const sub = adminDb.collection('credits').doc(id).collection('installments')
    pendingIds.forEach((instId) => {
      batch.update(sub.doc(instId), { status: 'CANCELLED' })
    })
    await batch.commit()

    return creditsRepository.update(id, { status: 'CANCELLED' })
  },

  async deleteCredit(id: string, userId: string): Promise<void> {
    const credit = await creditsRepository.findById(id, userId)
    if (!credit) throw new Error('Crédito no encontrado o no autorizado.')
    if (credit.status === 'ACTIVE') {
      throw new Error('No puedes eliminar un crédito activo. Cancélalo primero.')
    }
    return creditsRepository.delete(id)
  },

  async payInstallments(
    creditId: string,
    data: { installment_ids: string[]; amount: number; account_id: string },
    userId: string,
  ): Promise<void> {
    const credit = await creditsRepository.findById(creditId, userId)
    if (!credit) throw new Error('Crédito no encontrado o no autorizado.')

    const installments = await creditsRepository.findInstallments(creditId)
    const selected = installments.filter((i) => data.installment_ids.includes(i.id))

    // ── Create a single transaction for the selected installment ──────────────
    const transactionIds: Record<string, string> = {}
    const today = new Date().toISOString().split('T')[0]

    for (const inst of selected) {
      const tx = await transactionService.createWithBalance({
        account_id: data.account_id,
        type: 'EXPENSE',
        amount: data.amount,
        currency: credit.currency,
        date: today,
        description: `Cuota #${inst.number} - ${credit.institution} (${CREDIT_TYPES.find((t) => t.value === credit.type)?.label ?? credit.type})`,
        subtype: 'Cuota crédito',
        status: 'COMPLETED',
        credit_id: creditId,
        installment_id: inst.id,
      }, userId)
      transactionIds[inst.id] = tx.id
    }

    // ── Mark installments as paid ─────────────────────────────────────────────
    await creditsRepository.markInstallmentsPaid(creditId, data.installment_ids, today, transactionIds)

    // ── Update credit progress ────────────────────────────────────────────────
    const newPaid = credit.paid_installments + selected.length
    const totalPrincipalPaid = selected.reduce((sum, i) => sum + i.principal, 0)
    const newBalance = credit.current_balance - totalPrincipalPaid
    const allPaid = newPaid >= credit.total_installments

    await creditsRepository.update(creditId, {
      paid_installments: newPaid,
      current_balance: Math.max(0, newBalance),
      status: allPaid ? 'PAID' : 'ACTIVE',
    })
  },

  async revertInstallmentPayment(
    creditId: string,
    installmentId: string,
    userId: string,
  ): Promise<void> {
    const credit = await creditsRepository.findById(creditId, userId)
    if (!credit) throw new Error('Crédito no encontrado o no autorizado.')

    const installments = await creditsRepository.findInstallments(creditId)
    const installment = installments.find((i) => i.id === installmentId)
    if (!installment) throw new Error('Cuota no encontrada.')
    if (installment.status !== 'PAID') return // ya está revertida

    // ── Determine new status (PENDING or OVERDUE) ────────────────────────────
    const now = new Date()
    const due = new Date(installment.due_date)
    const newStatus = due < now ? 'OVERDUE' : 'PENDING'

    // ── Mark installment as unpaid ───────────────────────────────────────────
    await creditsRepository.updateInstallment(creditId, installmentId, {
      status: newStatus,
      paid_at: null,
      transaction_id: null,
    })

    // ── Update credit progress ───────────────────────────────────────────────
    const newPaid = Math.max(0, credit.paid_installments - 1)
    const newBalance = credit.current_balance + installment.principal
    const wasPaid = credit.status === 'PAID'

    await creditsRepository.update(creditId, {
      paid_installments: newPaid,
      current_balance: newBalance,
      status: wasPaid ? 'ACTIVE' : credit.status,
    })
  },
}
