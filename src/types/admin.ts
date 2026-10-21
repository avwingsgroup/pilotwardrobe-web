import type { CountryCode, CurrencyCode, Id, IsoDateTime, ListQuery, Money } from './api'
import type { MediaAsset } from './media'
import type { Permission, UserRole } from './permissions'
import type { DisputeDecision, DisputeMessage } from './dispute'
import type { EscrowStatus, OrderStatus } from './order'
import type { KycDocumentType } from './verification'
import type { AccountStatus, KycStatus } from './user'
import type { PaymentGateway } from './payment'

export type RiskLevel = 'low' | 'medium' | 'high'
export type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface AdminQuery extends ListQuery {
  status?: string
  tab?: string
  [filter: string]: string | number | boolean | undefined
}

/* ── Overview (AD2) ─────────────────────────────────────────── */
export interface KpiMetric {
  key: 'gmv' | 'escrow' | 'revenue' | 'active_users' | 'dispute_rate'
  label: string
  value: string
  delta: string
  trend: 'up' | 'down' | 'flat'
  positive: boolean
  caption?: string | null
  sparkline: number[]
}

export interface WorkQueue {
  key: 'kyc' | 'disputes' | 'reports' | 'listings' | 'payouts'
  label: string
  detail: string
  count: number
  to: string
  permission: Permission
}

export interface RiskSignal {
  id: Id
  title: string
  detail: string
}

export interface AdminOverview {
  greetingName: string
  periodLabel: string
  kpis: KpiMetric[]
  series: { date: string; gmv: number; orders: number }[]
  queues: WorkQueue[]
  latestOrders: AdminOrderRow[]
  riskSignals: RiskSignal[]
  systemStatus: 'normal' | 'degraded' | 'outage'
}

/* ── Users (AD3/AD4) ────────────────────────────────────────── */
export interface AdminUserRow {
  id: Id
  code: string
  displayName: string
  initials: string
  email: string
  role: UserRole
  roleLabel: string
  kycStatus: KycStatus
  countryCode: CountryCode
  countryName: string
  trades: number
  gmv: Money
  risk: RiskLevel
  status: AccountStatus
  joinedAt: IsoDateTime
}

export interface AdminUserDetail extends AdminUserRow {
  phoneMasked: string
  city: string
  signupMethod: string
  stats: { gmvSold: Money; tradesSold: number; gmvBought: Money; ordersBought: number; rating: number; reviews: number; disputes: number; disputesOpen: number; disputesWon: number; wallet: Money; walletEscrow: Money }
  identity: { documentLabel: string; checks: { label: string; detail: string; passed: boolean }[]; image?: MediaAsset | null }
  riskScore: number
  riskDetail: string
  limits: { canList: boolean; canReceivePayouts: boolean; canTrade: boolean; instantPayouts: boolean; dailyPayoutLimit: Money }
  activity: { id: Id; label: string; detail: string; state: 'ok' | 'flag' }[]
  notes: { id: Id; author: string; initials: string; body: string; createdAt: IsoDateTime }[]
}

/* ── KYC (AD5) ──────────────────────────────────────────────── */
export interface KycCaseRow {
  id: Id
  code: string
  userId: Id
  displayName: string
  initials: string
  documentType: KycDocumentType
  documentLabel: string
  countryCode: CountryCode
  ageHours: number
  overSla: boolean
  status: 'pending' | 'escalated' | 'done'
}

export interface KycCaseDetail extends KycCaseRow {
  submittedAt: IsoDateTime
  autoChecksPassed: number
  autoChecksTotal: number
  document: MediaAsset | null
  selfie: MediaAsset | null
  extracted: { field: string; document: string; profile: string; match: boolean | 'warn' }[]
  automatedChecks: { label: string; result: string; passed: boolean | 'warn' }[]
}

/* ── Moderation (AD6) ───────────────────────────────────────── */
export interface ModerationItem {
  id: Id
  listingId: Id
  title: string
  image: MediaAsset | null
  sellerName: string
  priceLabel: string
  flag: string
  flagTone: 'danger' | 'warning' | 'neutral'
  detail: string
  queue: 'needs_review' | 'live' | 'changes_requested' | 'removed'
}

/* ── Orders & escrow (AD7/AD8) ──────────────────────────────── */
export interface AdminOrderRow {
  id: Id
  number: string
  itemTitle: string
  itemImage: MediaAsset | null
  buyerName: string
  sellerName: string
  total: Money
  status: OrderStatus
  escrowStatus: EscrowStatus
  escrowLabel: string
  freightLabel: string
  freightAlert?: boolean
  ageLabel: string
  risk: RiskLevel
}

export interface AdminOrderDetail extends AdminOrderRow {
  createdAt: IsoDateTime
  paymentGateway: PaymentGateway
  paymentReference: string
  ledger: { at: IsoDateTime; entry: string; amount: Money }[]
  riskSignals: string[]
  breakdown: { subtotal: Money; platformFee: Money; sellerWouldReceive: Money }
  parties: { role: 'buyer' | 'seller'; name: string; detail: string; risk: RiskLevel }[]
  refundMethodLabel: string
}

export interface RefundPayload {
  type: 'full' | 'partial'
  amount?: number
  reason: string
  note: string
  suspendBuyer: boolean
}

export interface EscrowStats {
  awaitingDispatch: { count: number; detail: string }
  airborne: { count: number; held: Money }
  landed: { count: number; detail: string }
  onHold: { count: number; detail: string }
  released30d: { count: number; amount: Money }
}

/* ── Disputes (AD9) ─────────────────────────────────────────── */
export interface AdminDisputeRow {
  id: Id
  number: string
  title: string
  amount: Money
  parties: string
  due: string
  dueTone: 'warning' | 'danger' | 'neutral'
  bucket: 'mine' | 'unassigned' | 'closed'
}

export interface AdminDisputeDetail extends AdminDisputeRow {
  orderNumber: string
  frozen: Money
  openedAt: IsoDateTime
  assignee: string
  listingSaid: string[]
  buyerEvidence: MediaAsset[]
  evidenceSummary: string[]
  thread: DisputeMessage[]
  stats: { sellerDisputeRate: string; buyerDisputeRate: string; sellerOffer: string }
  decisionOptions: { value: DisputeDecision; label: string; detail: string }[]
  policyOptions: string[]
}

export interface DisputeDecisionPayload {
  decision: DisputeDecision
  amountToBuyer?: number
  policyReference: string
}

/* ── Reports (AD10) ─────────────────────────────────────────── */
export interface ReportRow {
  id: Id
  severity: Severity
  title: string
  detail: string
  target: string
  source: string
  reportedAgo: string
  assignee?: { initials: string; name: string } | null
  primaryAction?: { key: 'remove' | 'warn' | 'suspend_all' | 'request_edit' | 'hide_review'; label: string; tone: 'danger' | 'neutral' } | null
  type: 'listing' | 'user' | 'message' | 'review'
}

/* ── Payouts (AD11) ─────────────────────────────────────────── */
export interface PayoutRow {
  id: Id
  sellerName: string
  initials: string
  sellerDetail: string
  amount: Money
  destination: string
  reason: string
  requestedAt: string
  flagged: boolean
  status: 'awaiting_approval' | 'processing' | 'paid' | 'failed'
}

export interface PayoutStats {
  awaiting: { count: number; amount: Money }
  processing: { count: number; amount: Money }
  paid7d: { count: number; amount: Money }
  failed: { count: number; detail: string }
  pspBalance: { amount: Money; detail: string }
  nextBatch: string
}

/* ── Fees (AD12) ────────────────────────────────────────────── */
export interface CommissionRule {
  id: Id
  name: string
  detail: string
  appliesTo: string
  rate: number
  capMin: string
  status: 'live' | 'scheduled' | 'disabled'
}

export interface FeesOverview {
  monthLabel: string
  revenue: Money
  deltaLabel: string
  monthly: { month: string; value: number; current: boolean }[]
  breakdown: { label: string; amount: Money; share: number; tone: 'navy' | 'slate' | 'gold' | 'green' }[]
  rules: CommissionRule[]
  escrowTimings: { key: string; label: string; value: string }[]
  boostPackages: { label: string; price: Money }[]
}

/* ── Promotions (AD13) ──────────────────────────────────────── */
export interface Campaign {
  id: Id
  name: string
  detail: string
  status: 'scheduled' | 'live' | 'ended'
  dates: string
  performance: string
  image: MediaAsset | null
}

export interface PromoCode {
  id: Id
  code: string
  discount: string
  uses: string
  expires: string
  status: 'live' | 'ended' | 'scheduled'
}

/* ── Broadcasts (AD14) ──────────────────────────────────────── */
export interface BroadcastDraft {
  id?: Id
  channels: ('push' | 'email' | 'in_app' | 'sms')[]
  audience: string[]
  pushTitle: string
  pushBody: string
  emailSubject: string
  deepLink: string
  sendAt: string
  timezone: 'recipient' | 'utc' | 'wat'
  respectQuietHours: boolean
}

/* ── Content (AD15) ─────────────────────────────────────────── */
export interface HeroSlide {
  id: Id
  position: number
  headline: string
  subtext: string
  buttonLabel: string
  link: string
  audience: string
  locales: string
  status: 'live' | 'scheduled' | 'draft'
  schedule: string
  image: MediaAsset | null
}

export interface ContentPage {
  slug: string
  title: string
  /** Sanitised, server-rendered HTML. Rendered through DOMPurify on the client as defence in depth. */
  html: string
  updatedAt: IsoDateTime
}

/* ── Catalogue (AD16) ───────────────────────────────────────── */
export interface CatalogueNode {
  id: Id
  name: string
  count: number
  children?: CatalogueNode[]
}

export interface CategoryAttribute {
  name: string
  type: 'size_chart' | 'single_select' | 'swatch' | 'boolean' | 'text'
  required: boolean
  filterable: boolean
  values: string
}

export interface SizeChart {
  name: string
  unit: 'cm' | 'in'
  columns: string[]
  rows: string[][]
}

/* ── Analytics (AD17) ───────────────────────────────────────── */
export interface AnalyticsOverview {
  periodLabel: string
  funnel: { label: string; value: number; percent: number }[]
  gmvByCategory: { label: string; share: number; tone: string }[]
  cohorts: { month: string; values: number[] }[]
  trustSafety: { label: string; value: string }[]
}

/* ── Team & roles (AD18) ────────────────────────────────────── */
export type PermissionLevel = 'manage' | 'view' | 'none'

export interface StaffRole {
  id: Id
  name: string
  members: number
  matrix: Record<'view' | 'users' | 'kyc' | 'listings' | 'orders' | 'refunds' | 'disputes' | 'payouts' | 'fees' | 'content' | 'team', PermissionLevel>
}

export interface StaffMember {
  id: Id
  name: string
  initials: string
  email: string
  roleName: string
  twoFactor: string
  lastActive: string
  status: 'active' | 'invited' | 'suspended'
}

/* ── Audit log (AD19) ───────────────────────────────────────── */
export interface AuditEntry {
  id: Id
  at: IsoDateTime
  actor: { name: string; initials: string; system: boolean }
  action: string
  tone: 'danger' | 'warning' | 'success' | 'info'
  target: string
  details: string
  ip: string | null
}

/* ── Platform settings (AD20) ───────────────────────────────── */
export interface MarketSetting {
  countryCode: CountryCode
  name: string
  detail: string
  enabled: boolean
  status: 'live' | 'beta' | 'off'
}

export interface FeatureFlag {
  key: string
  label: string
  detail: string
  enabled: boolean
}

export interface GatewaySetting {
  code: PaymentGateway
  name: string
  enabled: boolean
  currencies: CurrencyCode[]
  countries: CountryCode[]
  mode: 'live' | 'test'
  /** Masked public key only; secrets are write-only on the server. */
  publicKeyMasked: string | null
  webhookStatus: 'healthy' | 'failing' | 'unconfigured'
}

export interface PlatformSettings {
  markets: MarketSetting[]
  displayCurrencies: CurrencyCode[]
  settlementCurrency: CurrencyCode
  fxMarginPercent: number
  featureFlags: FeatureFlag[]
  gateways: GatewaySetting[]
  maintenance: { scheduled: boolean; window?: string | null }
}

export interface StaffSessionInfo {
  name: string
  roleLabel: string
  initials: string
}
