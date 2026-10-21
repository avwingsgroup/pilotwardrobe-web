import type { Id, IsoDateTime, Money } from './api'
import type { MediaAsset } from './media'

export type DisputeReason = 'not_as_described' | 'not_received' | 'damaged' | 'counterfeit'

export type DisputeResolutionRequest = 'full_refund' | 'partial_refund' | 'return_and_refund' | 'replacement'

export type DisputeStatus =
  | 'open'
  | 'awaiting_seller'
  | 'under_review'
  | 'resolved_buyer'
  | 'resolved_seller'
  | 'resolved_split'
  | 'withdrawn'
  | 'appealed'

export type DisputeDecision = 'release_to_seller' | 'partial_refund' | 'full_refund_with_return' | 'full_refund_no_return'

export interface DisputeMessage {
  id: Id
  author: { displayName: string; initials: string; role: 'buyer' | 'seller' | 'mediator' | 'system' }
  body: string
  attachments?: MediaAsset[]
  internal?: boolean
  createdAt: IsoDateTime
}

export interface DisputeStep {
  label: string
  detail: string
  state: 'done' | 'current' | 'upcoming'
}

export interface Dispute {
  id: Id
  number: string
  orderId: Id
  orderNumber: string
  reason: DisputeReason
  reasonLabel: string
  status: DisputeStatus
  requested: DisputeResolutionRequest
  requestedAmount?: Money | null
  escrowFrozen: Money
  mediator?: { displayName: string; initials: string } | null
  openedAt: IsoDateTime
  decisionDueAt?: IsoDateTime | null
  description: string
  evidence: MediaAsset[]
  messages: DisputeMessage[]
  steps: DisputeStep[]
  sellerProposal?: { summary: string; amount: Money; status: 'pending' | 'accepted' | 'declined' } | null
  viewerRole: 'buyer' | 'seller'
  allowedActions: ('reply' | 'withdraw' | 'accept_proposal' | 'decline_proposal' | 'attach')[]
  item: { title: string; image?: MediaAsset | null; price: Money }
  counterpartyName: string
}

export interface OpenDisputePayload {
  orderId: Id
  reason: DisputeReason
  requested: DisputeResolutionRequest
  amount?: { amount: number; currency: Money['currency'] } | null
  description: string
  evidenceIds: Id[]
}
