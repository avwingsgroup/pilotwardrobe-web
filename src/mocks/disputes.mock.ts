import type { Dispute } from '@/types/dispute'
import type { CurrencyCode } from '@/types/api'
import { mockMedia } from './media'
import { daysAgo, hoursAgo, inDays } from './time'

const usd = (amount: number) => ({ amount, currency: 'USD' as CurrencyCode })

export const disputes: Dispute[] = [
  {
    id: 'dsp_2041',
    number: 'DS-2041',
    orderId: 'ord_4468',
    orderNumber: 'PW-4468',
    reason: 'not_as_described',
    reasonLabel: 'Item not as described',
    status: 'under_review',
    requested: 'partial_refund',
    requestedAmount: usd(4500),
    escrowFrozen: usd(14500),
    mediator: { displayName: 'Amaka N.', initials: 'AN' },
    openedAt: daysAgo(3),
    decisionDueAt: inDays(2),
    description: 'Label reads S. Chest 98 cm vs listing 104 cm. Requesting a $45 partial refund. 2 photos attached.',
    evidence: [mockMedia('uniform-shirt', 'Shirt size label photo'), mockMedia('uniform-shirt', 'Shirt chest measurement photo')],
    messages: [
      { id: 'dm_1', author: { displayName: 'You', initials: 'NO', role: 'buyer' }, body: 'Label reads S. Chest 98 cm vs listing 104 cm. Requesting a $45 partial refund. 2 photos attached.', createdAt: daysAgo(3) },
      { id: 'dm_2', author: { displayName: 'Nehemiah O.', initials: 'NO', role: 'seller' }, body: 'The shirt was listed as M as per the original tag. Happy to accept a return for a full refund.', createdAt: daysAgo(2) },
      { id: 'dm_3', author: { displayName: 'Amaka N.', initials: 'AN', role: 'mediator' }, body: 'Thanks both. Seller, can you share a photo of the size label taken before dispatch? Buyer, please keep the item and packaging until we decide.', createdAt: hoursAgo(4) },
    ],
    steps: [
      { label: 'Dispute opened', detail: 'escrow frozen', state: 'done' },
      { label: 'Seller responded', detail: 'offered return', state: 'done' },
      { label: 'Mediator reviewing', detail: 'Decision due in 2 days', state: 'current' },
      { label: 'Resolution', detail: 'Funds released per decision', state: 'upcoming' },
    ],
    sellerProposal: { summary: 'Return the item for a full refund of $145.00. Return label paid by seller.', amount: usd(14500), status: 'pending' },
    viewerRole: 'buyer',
    allowedActions: ['reply', 'withdraw', 'accept_proposal', 'decline_proposal', 'attach'],
    item: { title: 'Aviator Uniform Shirt — size M', image: mockMedia('uniform-shirt'), price: usd(14500) },
    counterpartyName: 'Nehemiah O.',
  },
]
