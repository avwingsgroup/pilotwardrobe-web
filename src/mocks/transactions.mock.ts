import type { WalletBalance, WalletTransaction, PayoutMethod, PayoutSchedule } from '@/types/wallet'
import type { CurrencyCode } from '@/types/api'
import { daysAgo } from './time'

const usd = (amount: number) => ({ amount, currency: 'USD' as CurrencyCode })

export const wallet: WalletBalance = {
  available: usd(341055),
  inEscrow: usd(128400),
  pendingRelease: usd(14500),
  lifetimeEarnings: usd(1892040),
  total: usd(469455),
  escrowOrders: 2,
  pendingReleaseIn: '71h',
  thisMonthEarnings: usd(214000),
}

export const transactions: WalletTransaction[] = [
  { id: 'tx_1', occurredAt: daysAgo(1), description: 'Sale · Aviator Uniform Shirt', detail: 'Order #PW-4468 · fee $11.60', type: 'sale', status: 'pending', amount: usd(13340), direction: 'credit', orderId: 'ord_4468' },
  { id: 'tx_2', occurredAt: daysAgo(3), description: 'Sale · Jeppesen Captain Flight Bag', detail: 'Order #PW-4471', type: 'sale', status: 'in_escrow', amount: usd(16560), direction: 'credit', orderId: 'ord_4471' },
  { id: 'tx_3', occurredAt: daysAgo(6), description: 'Payout to GTBank •••• 0921', detail: 'Ref PO-88213', type: 'withdrawal', status: 'paid', amount: usd(120000), direction: 'debit', reference: 'PO-88213' },
  { id: 'tx_4', occurredAt: daysAgo(8), description: 'Jetstream boost · DC ONE-X', detail: '7 days', type: 'promotion', status: 'paid', amount: usd(999), direction: 'debit' },
  { id: 'tx_5', occurredAt: daysAgo(10), description: 'Refund · dispute #DS-1988', detail: 'Returned to buyer', type: 'refund', status: 'complete', amount: usd(4200), direction: 'debit' },
  { id: 'tx_6', occurredAt: daysAgo(14), description: 'Sale · E6B flight computer', detail: 'Order #PW-4402', type: 'sale', status: 'released', amount: usd(5520), direction: 'credit', orderId: 'ord_4402' },
  { id: 'tx_7', occurredAt: daysAgo(20), description: 'Sale · Randolph Aviator CR', detail: 'Order #PW-4380', type: 'sale', status: 'released', amount: usd(19320), direction: 'credit' },
  { id: 'tx_8', occurredAt: daysAgo(26), description: 'Payout to Wise •••• 7714', detail: 'Ref PO-87011', type: 'withdrawal', status: 'paid', amount: usd(50000), direction: 'debit' },
]

export const payoutMethods: PayoutMethod[] = [
  { id: 'pm_1', kind: 'bank', label: 'GTBank · NGN', currency: 'NGN', last4: '0921', isDefault: true },
  { id: 'pm_2', kind: 'wise', label: 'Wise · USD', currency: 'USD', last4: '7714', isDefault: false },
]

export const payoutSchedule: PayoutSchedule = {
  enabled: true,
  frequency: 'weekly',
  dayLabel: 'Weekly, every Monday',
  threshold: usd(10000),
}
