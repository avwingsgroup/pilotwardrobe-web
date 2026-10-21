import type {
  AdminDisputeDetail,
  AdminOrderDetail,
  AdminOrderRow,
  AdminOverview,
  AdminUserDetail,
  AdminUserRow,
  AnalyticsOverview,
  AuditEntry,
  Campaign,
  CatalogueNode,
  CategoryAttribute,
  EscrowStats,
  FeesOverview,
  HeroSlide,
  KycCaseDetail,
  KycCaseRow,
  ModerationItem,
  PayoutRow,
  PayoutStats,
  PlatformSettings,
  PromoCode,
  ReportRow,
  SizeChart,
  StaffMember,
  StaffRole,
} from '@/types/admin'
import type { CurrencyCode } from '@/types/api'
import { UserRole } from '@/types/permissions'
import { mockMedia } from './media'
import { daysAgo, hoursAgo } from './time'

const usd = (amount: number) => ({ amount, currency: 'USD' as CurrencyCode })

/* ── Users ─────────────────────────────────────────────────── */
export const adminUsers: AdminUserRow[] = [
  { id: 'usr_10422', code: 'U-10422', displayName: 'Nehemiah Okoye', initials: 'NO', email: 'airboy@gmail.com', role: UserRole.USER, roleLabel: 'Verified seller', kycStatus: 'approved', countryCode: 'NG', countryName: 'Nigeria', trades: 112, gmv: usd(1892000), risk: 'low', status: 'active', joinedAt: '2025-03-12T00:00:00Z' },
  { id: 'usr_09981k', code: 'U-09981', displayName: 'Kunle Taiwo', initials: 'KT', email: 'kunle.t@outlook.com', role: UserRole.USER, roleLabel: 'Verified seller', kycStatus: 'approved', countryCode: 'NG', countryName: 'Nigeria', trades: 27, gmv: usd(641000), risk: 'low', status: 'active', joinedAt: '2024-02-01T00:00:00Z' },
  { id: 'usr_12409', code: 'U-12409', displayName: 'new_user_8812', initials: '?', email: 'fly8812@proton.me', role: UserRole.USER, roleLabel: 'Buyer', kycStatus: 'not_started', countryCode: 'GH', countryName: 'Ghana', trades: 0, gmv: usd(0), risk: 'high', status: 'active', joinedAt: daysAgo(1) },
  { id: 'usr_07720', code: 'U-07720', displayName: 'Tunde Shot Aviation', initials: 'TS', email: 'studio@tundeshot.com', role: UserRole.USER, roleLabel: 'Photographer', kycStatus: 'approved', countryCode: 'NG', countryName: 'Nigeria', trades: 214, gmv: usd(988000), risk: 'low', status: 'active', joinedAt: '2024-11-01T00:00:00Z' },
  { id: 'usr_11034', code: 'U-11034', displayName: 'Ifeoma Afolabi', initials: 'IA', email: 'ifeoma.af@gmail.com', role: UserRole.USER, roleLabel: 'Buyer', kycStatus: 'pending', countryCode: 'GB', countryName: 'UK', trades: 6, gmv: usd(114000), risk: 'medium', status: 'active', joinedAt: '2025-05-01T00:00:00Z' },
  { id: 'usr_10877', code: 'U-10877', displayName: 'Richard Mensah', initials: 'RM', email: 'r.mensah@gmail.com', role: UserRole.AVIATOR, roleLabel: 'Verified seller', kycStatus: 'approved', countryCode: 'GH', countryName: 'Ghana', trades: 41, gmv: usd(722000), risk: 'low', status: 'active', joinedAt: '2025-04-01T00:00:00Z' },
  { id: 'usr_08812', code: 'U-08812', displayName: 'jetdeals_ng', initials: 'JD', email: 'jetdeals.ng@gmail.com', role: UserRole.USER, roleLabel: 'Seller', kycStatus: 'rejected', countryCode: 'NG', countryName: 'Nigeria', trades: 3, gmv: usd(42000), risk: 'high', status: 'suspended', joinedAt: '2025-01-15T00:00:00Z' },
  { id: 'usr_102', code: 'U-00102', displayName: 'Captain James', initials: 'CJ', email: 'aviator@example.com', role: UserRole.AVIATOR, roleLabel: 'Aviator', kycStatus: 'approved', countryCode: 'NG', countryName: 'Nigeria', trades: 140, gmv: usd(1290000), risk: 'low', status: 'active', joinedAt: '2024-02-01T00:00:00Z' },
]

export function adminUserDetail(row: AdminUserRow): AdminUserDetail {
  return {
    ...row,
    phoneMasked: '+234 •••• 4417',
    city: row.countryCode === 'NG' ? 'Lagos, NG' : 'Accra, GH',
    signupMethod: 'Google',
    stats: { gmvSold: row.gmv, tradesSold: row.trades, gmvBought: usd(241000), ordersBought: 9, rating: 4.9, reviews: 86, disputes: 2, disputesOpen: 1, disputesWon: 1, wallet: usd(469455), walletEscrow: usd(128400) },
    identity: {
      documentLabel: 'Passport · NGA',
      checks: [
        { label: 'Document authentic', detail: 'Passport · NGA', passed: true },
        { label: 'Face match', detail: '98.4%', passed: true },
        { label: 'Sanctions & PEP screening', detail: 'Clear · Jul 22', passed: true },
        { label: 'Address', detail: 'Utility bill · Lagos', passed: true },
      ],
      image: null,
    },
    riskScore: row.risk === 'high' ? 87 : row.risk === 'medium' ? 45 : 12,
    riskDetail: row.risk === 'high' ? 'High · 4 linked accounts · shared device' : 'Low · 0 linked accounts · 1 device fingerprint',
    limits: { canList: true, canReceivePayouts: true, canTrade: true, instantPayouts: false, dailyPayoutLimit: usd(500000) },
    activity: [
      { id: 'a1', label: 'Withdrew $1,200.00 to GTBank •••• 0921', detail: 'Jul 26 · 2FA passed · IP 102.89.•.•', state: 'ok' },
      { id: 'a2', label: 'Disputed by buyer · #DS-2041', detail: 'Jul 29 · item not as described', state: 'flag' },
      { id: 'a3', label: 'Listed Bose A20 Aviation Headset', detail: 'Jul 18', state: 'ok' },
      { id: 'a4', label: 'Login from new device · iPad Safari', detail: 'Jul 22 · Abuja', state: 'ok' },
    ],
    notes: [
      { id: 'n1', author: 'Amaka N.', initials: 'AN', body: 'Seller offered return on DS-2041 promptly. Good faith.', createdAt: daysAgo(1) },
      { id: 'n2', author: 'Tolu A.', initials: 'TA', body: 'Raised listing cap after KYC.', createdAt: daysAgo(10) },
    ],
  }
}

/* ── KYC ───────────────────────────────────────────────────── */
export const kycQueue: KycCaseRow[] = [
  { id: 'kyc_7731', code: 'KY-7731', userId: 'usr_11034', displayName: 'Ifeoma Afolabi', initials: 'IA', documentType: 'passport', documentLabel: 'Passport · UK', countryCode: 'GB', ageHours: 26, overSla: true, status: 'pending' },
  { id: 'kyc_7732', code: 'KY-7732', userId: 'usr_13001', displayName: 'Bisi Oladipo', initials: 'BO', documentType: 'national_id', documentLabel: 'NIN · NG', countryCode: 'NG', ageHours: 25, overSla: true, status: 'pending' },
  { id: 'kyc_7733', code: 'KY-7733', userId: 'usr_13002', displayName: 'Samuel Kofi', initials: 'SK', documentType: 'drivers_licence', documentLabel: "Driver's licence · GH", countryCode: 'GH', ageHours: 19, overSla: false, status: 'pending' },
  { id: 'kyc_7734', code: 'KY-7734', userId: 'usr_13003', displayName: 'Zainab Ali', initials: 'ZA', documentType: 'pilot_licence', documentLabel: 'Pilot licence · NG', countryCode: 'NG', ageHours: 8, overSla: false, status: 'pending' },
  { id: 'kyc_7735', code: 'KY-7735', userId: 'usr_13004', displayName: 'Paul Eze', initials: 'PE', documentType: 'passport', documentLabel: 'Passport · NG', countryCode: 'NG', ageHours: 3, overSla: false, status: 'pending' },
  { id: 'kyc_7736', code: 'KY-7736', userId: 'usr_13005', displayName: 'Mariam K.', initials: 'MK', documentType: 'national_id', documentLabel: 'NIN · NG', countryCode: 'NG', ageHours: 1, overSla: false, status: 'pending' },
  { id: 'kyc_7701', code: 'KY-7701', userId: 'usr_13006', displayName: 'Femi Bakare', initials: 'FB', documentType: 'passport', documentLabel: 'Passport · NG', countryCode: 'NG', ageHours: 40, overSla: true, status: 'escalated' },
]

export const kycDetail = (row: KycCaseRow): KycCaseDetail => ({
  ...row,
  submittedAt: hoursAgo(row.ageHours),
  autoChecksPassed: 3,
  autoChecksTotal: 4,
  document: null,
  selfie: null,
  extracted: [
    { field: 'Full name', document: row.displayName.toUpperCase(), profile: row.displayName, match: true },
    { field: 'Date of birth', document: '14 MAR 1994', profile: '14/03/1994', match: true },
    { field: 'Nationality', document: row.countryCode === 'GB' ? 'GBR' : 'NGA', profile: row.countryCode === 'GB' ? 'United Kingdom' : 'Nigeria', match: true },
    { field: 'Document no.', document: '5•••••812', profile: '—', match: true },
    { field: 'Expiry', document: '02 SEP 2026', profile: 'Expires soon', match: 'warn' },
  ],
  automatedChecks: [
    { label: 'Document authenticity', result: 'MRZ valid', passed: true },
    { label: 'Face match', result: '96.1%', passed: true },
    { label: 'Liveness', result: 'Passed', passed: true },
    { label: 'Sanctions & PEP', result: '1 partial name match', passed: 'warn' },
    { label: 'Duplicate identity', result: 'None', passed: true },
  ],
})

/* ── Moderation ────────────────────────────────────────────── */
export const moderationItems: ModerationItem[] = [
  { id: 'mod_1', listingId: 'lst_801', title: 'Bose A20 ×3 — new in box', image: mockMedia('bose-a20'), sellerName: 'new_user_8812', priceLabel: '$745 each · 2h', flag: 'Price anomaly', flagTone: 'danger', detail: 'new_user_8812 · $745 each · 2h', queue: 'needs_review' },
  { id: 'mod_2', listingId: 'lst_802', title: 'Altimeter smartwatch', image: mockMedia('altimeter-smartwatch'), sellerName: 'R. Mensah', priceLabel: '$210', flag: 'Missing info', flagTone: 'warning', detail: 'R. Mensah · $210 · missing serial', queue: 'needs_review' },
  { id: 'mod_3', listingId: 'lst_803', title: 'Ray-Ban Aviator “OEM”', image: mockMedia('randolph-aviator'), sellerName: 'jetdeals_ng', priceLabel: '$35', flag: 'Counterfeit risk', flagTone: 'danger', detail: 'jetdeals_ng · $35', queue: 'needs_review' },
  { id: 'mod_4', listingId: 'lst_804', title: 'Garmin aera 760 handheld', image: mockMedia('garmin-handheld-gps'), sellerName: 'P. Eze', priceLabel: '$999', flag: 'Restricted item', flagTone: 'warning', detail: 'P. Eze · $999 · export-controlled?', queue: 'needs_review' },
  { id: 'mod_5', listingId: 'lst_805', title: 'A320 FCOM binder set', image: mockMedia('tablet-kneeboard'), sellerName: 'Capt. Bello', priceLabel: '$150', flag: 'Copyright report', flagTone: 'warning', detail: 'Capt. Bello · reported by 2 users', queue: 'needs_review' },
  { id: 'mod_6', listingId: 'lst_806', title: 'Lightspeed Zulu 3, LEMO', image: mockMedia('lightspeed-zulu-3'), sellerName: 'Ifeoma A.', priceLabel: '$540', flag: 'Unverified seller', flagTone: 'neutral', detail: 'Ifeoma A. · seller KYC pending', queue: 'needs_review' },
  { id: 'mod_7', listingId: 'lst_807', title: 'Kneeboard, iPad mini', image: mockMedia('tri-fold-kneeboard'), sellerName: 'Zainab A.', priceLabel: '$42', flag: 'Off-platform contact', flagTone: 'danger', detail: 'Zainab A. · contact info in photo', queue: 'needs_review' },
  { id: 'mod_8', listingId: 'lst_808', title: 'David Clark H10-13.4 Headset', image: mockMedia('david-clark-h10'), sellerName: 'S. Kofi', priceLabel: '$295', flag: 'Duplicate', flagTone: 'neutral', detail: 'S. Kofi · duplicate of LS-80021', queue: 'needs_review' },
  { id: 'mod_9', listingId: 'lst_809', title: 'E6B flight computer', image: mockMedia('e6b-flight-computer'), sellerName: 'P. Eze', priceLabel: '$60', flag: 'Edited after approval', flagTone: 'neutral', detail: 'P. Eze · price changed', queue: 'needs_review' },
]

/* ── Orders ────────────────────────────────────────────────── */
export const adminOrders: AdminOrderRow[] = [
  { id: 'ord_4479a', number: 'PW-4479', itemTitle: 'Bose A20 ×3', itemImage: mockMedia('bose-a20'), buyerName: 'new_user_8812', sellerName: 'K. Taiwo', total: usd(223500), status: 'on_hold', escrowStatus: 'on_hold', escrowLabel: 'On hold · risk', freightLabel: '—', ageLabel: '6h', risk: 'high' },
  { id: 'ord_4481', number: 'PW-4481', itemTitle: 'Garmin GDL 52', itemImage: mockMedia('captain-jacket'), buyerName: 'A. Musa', sellerName: 'Capt. A. Bello', total: usd(64820), status: 'awaiting_dispatch', escrowStatus: 'held', escrowLabel: 'Held', freightLabel: 'Label created', ageLabel: '1h', risk: 'low' },
  { id: 'ord_4480', number: 'PW-4480', itemTitle: 'DC ONE-X ENC', itemImage: mockMedia('david-clark-onex'), buyerName: 'J. Okon', sellerName: 'N. Okoye', total: usd(61500), status: 'awaiting_dispatch', escrowStatus: 'held', escrowLabel: 'Held', freightLabel: 'Dispatch overdue 1d', freightAlert: true, ageLabel: '4d', risk: 'low' },
  { id: 'ord_4478', number: 'PW-4478', itemTitle: 'Jeppesen Flight Bag', itemImage: mockMedia('jeppesen-flight-bag'), buyerName: 'G. Ebuko', sellerName: 'N. Okoye', total: usd(19340), status: 'in_transit', escrowStatus: 'held', escrowLabel: 'Held', freightLabel: 'DHL · in transit', ageLabel: '3d', risk: 'low' },
  { id: 'ord_4468', number: 'PW-4468', itemTitle: 'Uniform Shirt — M', itemImage: mockMedia('uniform-shirt'), buyerName: 'G. Ebuko', sellerName: 'N. Okoye', total: usd(14500), status: 'disputed', escrowStatus: 'frozen', escrowLabel: 'Frozen · dispute', freightLabel: 'Delivered Jul 31', ageLabel: '6d', risk: 'low' },
  { id: 'ord_4466', number: 'PW-4466', itemTitle: 'Swap · Zulu 3 ⇄ A20', itemImage: mockMedia('lightspeed-zulu-3'), buyerName: 'I. Afolabi', sellerName: 'N. Okoye', total: usd(18000), status: 'in_transit', escrowStatus: 'held', escrowLabel: 'Swap · both legs', freightLabel: 'Leg 1 landed · leg 2 airborne', ageLabel: '5d', risk: 'low' },
  { id: 'ord_4461', number: 'PW-4461', itemTitle: 'E6B flight computer', itemImage: mockMedia('e6b-flight-computer'), buyerName: 'P. Eze', sellerName: 'R. Mensah', total: usd(6410), status: 'completed', escrowStatus: 'released', escrowLabel: 'Released', freightLabel: 'Delivered Jul 24', ageLabel: '9d', risk: 'low' },
]

export const adminOrderDetail = (row: AdminOrderRow): AdminOrderDetail => ({
  ...row,
  createdAt: hoursAgo(6),
  paymentGateway: 'paystack',
  paymentReference: 'PSK_8812_a91f',
  ledger: [
    { at: hoursAgo(6), entry: 'Card payment captured (Paystack)', amount: row.total },
    { at: hoursAgo(6), entry: 'Escrow hold created', amount: row.total },
    { at: hoursAgo(5.9), entry: 'Auto-hold: risk rule R-12 velocity', amount: row.total },
  ],
  riskSignals: ['3 headsets from a 1-day-old account', 'Card BIN country ≠ IP country', 'Device seen on 4 accounts', 'Shipping address is a freight forwarder'],
  breakdown: { subtotal: row.total, platformFee: usd(Math.round(row.total.amount * 0.08)), sellerWouldReceive: usd(Math.round(row.total.amount * 0.92)) },
  parties: [
    { role: 'buyer', name: row.buyerName, detail: 'Buyer · KYC not started · risk HIGH', risk: 'high' },
    { role: 'seller', name: 'Kunle Taiwo', detail: 'Seller · verified · risk LOW', risk: 'low' },
  ],
  refundMethodLabel: 'Visa •••• 0031',
})

export const escrowStats: EscrowStats = {
  awaitingDispatch: { count: 86, detail: '12 past dispatch SLA' },
  airborne: { count: 231, held: usd(5821000) },
  landed: { count: 92, detail: '$24,890 auto-releases in <72h' },
  onHold: { count: 3, detail: 'Risk or dispute' },
  released30d: { count: 2914, amount: usd(41230000) },
}

/* ── Disputes ──────────────────────────────────────────────── */
export const adminDisputes: AdminDisputeDetail[] = [
  {
    id: 'dsp_2041',
    number: 'DS-2041',
    title: 'Not as described · $145',
    amount: usd(14500),
    parties: 'G. Ebuko vs N. Okoye',
    due: 'Due Aug 3',
    dueTone: 'warning',
    bucket: 'mine',
    orderNumber: 'PW-4468',
    frozen: usd(14500),
    openedAt: daysAgo(3),
    assignee: 'Amaka N.',
    listingSaid: ['Size M · chest 104 cm', 'Condition: New', 'Fit Kit match: Exact'],
    buyerEvidence: [mockMedia('uniform-shirt'), mockMedia('uniform-shirt')],
    evidenceSummary: ['Label: S', 'Chest 98 cm'],
    thread: [
      { id: 't1', author: { displayName: 'Buyer', initials: 'GE', role: 'buyer' }, body: 'Requesting $45 partial refund. Label reads S.', createdAt: daysAgo(3) },
      { id: 't2', author: { displayName: 'Seller', initials: 'NO', role: 'seller' }, body: 'Listed as M per original tag. Will accept a return for full refund.', createdAt: daysAgo(2) },
      { id: 't3', author: { displayName: 'You', initials: 'AN', role: 'mediator' }, body: 'Seller, please share a pre-dispatch photo of the size label.', createdAt: hoursAgo(4) },
    ],
    stats: { sellerDisputeRate: '1.8% (2 of 112)', buyerDisputeRate: '11% (1 of 9)', sellerOffer: 'Full refund with return' },
    decisionOptions: [
      { value: 'release_to_seller', label: 'Release to seller', detail: '$145.00 → seller' },
      { value: 'partial_refund', label: 'Partial refund', detail: 'Buyer $45 · seller $100' },
      { value: 'full_refund_with_return', label: 'Full refund', detail: 'Return required · label by seller' },
      { value: 'full_refund_no_return', label: 'Full refund, no return', detail: 'Buyer keeps item' },
    ],
    policyOptions: ['§8.2 Size mismatch vs listing', '§8.1 Condition mismatch', '§9.3 Non-delivery', '§10.1 Counterfeit goods'],
  },
  { id: 'dsp_2044', number: 'DS-2044', title: "Didn't arrive · $648", amount: usd(64800), parties: 'A. Musa vs Capt. Bello', due: 'Due today', dueTone: 'danger', bucket: 'mine' } as AdminDisputeDetail,
  { id: 'dsp_2039', number: 'DS-2039', title: 'Counterfeit claim · $35', amount: usd(3500), parties: 'P. Eze vs jetdeals_ng', due: 'Due today', dueTone: 'danger', bucket: 'mine' } as AdminDisputeDetail,
  { id: 'dsp_2045', number: 'DS-2045', title: 'Damaged · $210', amount: usd(21000), parties: 'Z. Ali vs R. Mensah', due: '5d left', dueTone: 'neutral', bucket: 'unassigned' } as AdminDisputeDetail,
  { id: 'dsp_2046', number: 'DS-2046', title: 'Swap leg missing · $540', amount: usd(54000), parties: 'I. Afolabi vs N. Okoye', due: '5d left', dueTone: 'neutral', bucket: 'unassigned' } as AdminDisputeDetail,
]

/* ── Reports ───────────────────────────────────────────────── */
export const reports: ReportRow[] = [
  { id: 'rep_1', severity: 'critical', title: 'Counterfeit Ray-Ban sold as genuine', detail: '3 reports · same seller', target: 'Listing LS-81120 · jetdeals_ng', source: 'User reports', reportedAgo: '2h', assignee: { initials: 'AN', name: 'Amaka N.' }, primaryAction: { key: 'remove', label: 'Remove', tone: 'danger' }, type: 'listing' },
  { id: 'rep_2', severity: 'high', title: 'Asking to pay by bank transfer', detail: 'Message flagged by keyword model', target: 'Conversation C-55102', source: 'Auto · NLP', reportedAgo: '3h', assignee: null, primaryAction: { key: 'warn', label: 'Warn user', tone: 'neutral' }, type: 'message' },
  { id: 'rep_3', severity: 'high', title: 'Multiple accounts, one device', detail: '4 accounts linked', target: 'User new_user_8812 +3', source: 'Auto · device graph', reportedAgo: '6h', assignee: { initials: 'TA', name: 'Tolu A.' }, primaryAction: { key: 'suspend_all', label: 'Suspend all', tone: 'danger' }, type: 'user' },
  { id: 'rep_4', severity: 'medium', title: 'Contact info in listing photo', detail: 'Phone number on kneeboard', target: 'Listing LS-80998 · Zainab A.', source: 'Auto · OCR', reportedAgo: '9h', assignee: null, primaryAction: { key: 'request_edit', label: 'Request edit', tone: 'neutral' }, type: 'listing' },
  { id: 'rep_5', severity: 'medium', title: 'Copyrighted manual', detail: 'FCOM reproduction', target: 'Listing LS-80420 · Capt. Bello', source: 'User reports (2)', reportedAgo: '1d', assignee: { initials: 'JO', name: 'Jide O.' }, primaryAction: null, type: 'listing' },
  { id: 'rep_6', severity: 'low', title: 'Review contains abuse', detail: '1-star with profanity', target: 'Review RV-33012', source: 'User report', reportedAgo: '1d', assignee: null, primaryAction: { key: 'hide_review', label: 'Hide review', tone: 'neutral' }, type: 'review' },
]

/* ── Payouts ───────────────────────────────────────────────── */
export const payouts: PayoutRow[] = [
  { id: 'po_1', sellerName: 'Nehemiah Okoye', initials: 'NO', sellerDetail: 'Verified · 112 trades', amount: usd(250000), destination: 'GTBank NGN •••• 0921', reason: 'Over $2,000 threshold', requestedAt: 'Today 09:12', flagged: false, status: 'awaiting_approval' },
  { id: 'po_2', sellerName: 'Tunde Shot Aviation', initials: 'TS', sellerDetail: 'Photographer', amount: usd(184000), destination: 'Wise USD •••• 4410', reason: 'First payout to Wise', requestedAt: 'Today 08:40', flagged: false, status: 'awaiting_approval' },
  { id: 'po_3', sellerName: 'jetdeals_ng', initials: 'JD', sellerDetail: 'Suspended', amount: usd(42000), destination: 'Opay NGN •••• 7781', reason: 'Account suspended · open reports', requestedAt: 'Jul 30', flagged: true, status: 'awaiting_approval' },
  { id: 'po_4', sellerName: 'Richard Mensah', initials: 'RM', sellerDetail: 'Verified', amount: usd(98000), destination: 'MTN MoMo GHS •••• 2201', reason: 'New payout method (<7 days)', requestedAt: 'Jul 30', flagged: false, status: 'awaiting_approval' },
  { id: 'po_5', sellerName: 'Kunle Taiwo', initials: 'KT', sellerDetail: 'Verified', amount: usd(65504), destination: 'Access NGN •••• 1180', reason: 'Velocity: 3rd payout this week', requestedAt: 'Jul 30', flagged: false, status: 'awaiting_approval' },
  { id: 'po_6', sellerName: 'Capt. A. Bello', initials: 'AB', sellerDetail: 'Verified', amount: usd(41200), destination: 'Zenith NGN •••• 3302', reason: 'Scheduled', requestedAt: 'Jul 29', flagged: false, status: 'processing' },
  { id: 'po_7', sellerName: 'Zainab Ali', initials: 'ZA', sellerDetail: 'Verified', amount: usd(12000), destination: 'UBA NGN •••• 0012', reason: 'Bank rejected: name mismatch', requestedAt: 'Jul 28', flagged: true, status: 'failed' },
]

export const payoutStats: PayoutStats = {
  awaiting: { count: 21, amount: usd(4128000) },
  processing: { count: 64, amount: usd(8841020) },
  paid7d: { count: 1208, amount: usd(31290455) },
  failed: { count: 2, detail: 'Bank rejected' },
  pspBalance: { amount: usd(41288000), detail: 'Paystack + Wise' },
  nextBatch: 'Mon Aug 4, 09:00 WAT · PSPs: Paystack (NGN), Wise (USD/GBP)',
}

/* ── Fees ──────────────────────────────────────────────────── */
export const fees: FeesOverview = {
  monthLabel: 'July 2026',
  revenue: usd(3863200),
  deltaLabel: '+21.4% vs June',
  monthly: ['A', 'S', 'O', 'N', 'D', 'J', 'F', 'M', 'A', 'M', 'J', 'J'].map((m, i) => ({ month: m, value: [52, 58, 64, 60, 70, 74, 80, 78, 84, 86, 88, 96][i]!, current: i === 11 })),
  breakdown: [
    { label: 'Sale commission · 76%', amount: usd(2941000), share: 76, tone: 'navy' },
    { label: 'Swap fees · 10%', amount: usd(388000), share: 10, tone: 'slate' },
    { label: 'Boosts · 8%', amount: usd(310200), share: 8, tone: 'gold' },
    { label: 'Buyer protection · 6%', amount: usd(224000), share: 6, tone: 'green' },
  ],
  rules: [
    { id: 'cr_1', name: 'Standard sale commission', detail: 'Charged to seller on release', appliesTo: 'All categories', rate: 8, capMin: 'Min $1.00', status: 'live' },
    { id: 'cr_2', name: 'Avionics & instruments', detail: 'High-value category', appliesTo: 'Avionics, Radios', rate: 6, capMin: 'Cap $120', status: 'live' },
    { id: 'cr_3', name: 'Photographer prints', detail: 'Digital + physical', appliesTo: 'Photographers', rate: 12, capMin: '—', status: 'live' },
    { id: 'cr_4', name: 'Swap fee', detail: 'Each side', appliesTo: 'Swaps', rate: 4, capMin: 'Min $2.00', status: 'live' },
    { id: 'cr_5', name: 'Buyer protection', detail: 'Added at checkout', appliesTo: 'All orders', rate: 2, capMin: 'Cap $25', status: 'live' },
    { id: 'cr_6', name: 'Launch promo · Ghana sellers', detail: 'Ends Sep 30', appliesTo: 'Sellers in GH', rate: 5, capMin: '—', status: 'scheduled' },
  ],
  escrowTimings: [
    { key: 'auto_release', label: 'Auto-release after delivery', value: '72 hours' },
    { key: 'dispatch_sla', label: 'Dispatch SLA', value: '3 days' },
    { key: 'dispute_window', label: 'Dispute window', value: '72 hours after landing' },
    { key: 'new_seller_hold', label: 'Payout hold for new sellers', value: '7 days' },
  ],
  boostPackages: [
    { label: 'Runway · 3 days', price: usd(499) },
    { label: 'Jetstream · 7 days', price: usd(999) },
    { label: 'Featured on home · 7 days', price: usd(2499) },
  ],
}

/* ── Promotions ────────────────────────────────────────────── */
export const campaigns: Campaign[] = [
  { id: 'cmp_1', name: 'Headset Week', detail: 'Home hero + category banner · free buyer protection', status: 'scheduled', dates: 'Aug 4 – Aug 10', performance: '—', image: mockMedia('hero-cockpit') },
  { id: 'cmp_2', name: 'Uniform Fit Kit launch', detail: 'Push + email · Fit Kit users', status: 'live', dates: 'Jul 15 – Aug 15', performance: '4,812 clicks · 3.9% CTR', image: mockMedia('uniform-shirt') },
  { id: 'cmp_3', name: 'Airshow print sale', detail: 'Photographers storefront · 15% off', status: 'ended', dates: 'Jul 1 – Jul 31', performance: '$6,210 GMV', image: mockMedia('photo-warbird-formation') },
  { id: 'cmp_4', name: 'Ghana seller launch', detail: '5% commission for GH sellers', status: 'live', dates: 'Jul 1 – Sep 30', performance: '214 new sellers', image: mockMedia('garmin-handheld-gps') },
]

export const promoCodes: PromoCode[] = [
  { id: 'pc_1', code: 'CLEARED10', discount: '10% off first order, max $25', uses: '1,204 / 5,000', expires: 'Sep 30', status: 'live' },
  { id: 'pc_2', code: 'FITKIT', discount: 'Free buyer protection on apparel', uses: '612 / ∞', expires: 'Aug 15', status: 'live' },
  { id: 'pc_3', code: 'AIRSHOW15', discount: '15% off prints', uses: '880 / 1,000', expires: 'Jul 31', status: 'ended' },
]

/* ── Content ───────────────────────────────────────────────── */
export const heroSlides: HeroSlide[] = [
  { id: 'hs_1', position: 1, headline: 'Buy, sell or swap premium aviation gear', subtext: 'The trusted marketplace for pilots, mechanics and fleet operators. Turn surplus hangar kit and flight gear into the assets you need — funds held in escrow until goods land.', buttonLabel: 'Shop verified gear', link: '/marketplace', audience: 'All users · always', locales: 'EN · FR · HA', status: 'live', schedule: 'always', image: mockMedia('hero-cockpit') },
  { id: 'hs_2', position: 2, headline: 'Headset Week · free buyer protection', subtext: 'ANR headsets from verified crews, with buyer protection on us until Sunday.', buttonLabel: 'Shop headsets', link: '/category/headsets', audience: 'NG, GH · Aug 4–10', locales: 'EN', status: 'scheduled', schedule: 'Aug 4–10', image: mockMedia('bose-a20') },
  { id: 'hs_3', position: 3, headline: 'Prints from aviation photographers', subtext: 'Raw, unfiltered aviation photography captured by pilots — prints and licences available.', buttonLabel: 'Browse photographers', link: '/photographers', audience: 'All users · always', locales: 'EN', status: 'live', schedule: 'always', image: mockMedia('photo-warbird-formation') },
]

/* ── Catalogue ─────────────────────────────────────────────── */
export const catalogue: CatalogueNode[] = [
  { id: 'cat_headsets', name: 'Headsets', count: 2410 },
  { id: 'cat_avionics', name: 'Avionics & GPS', count: 1862 },
  { id: 'cat_bags', name: 'Flight bags', count: 1104 },
  {
    id: 'cat_uniforms',
    name: 'Apparel & uniforms',
    count: 3920,
    children: [
      { id: 'cat_uniform_shirts', name: 'Uniform shirts', count: 1288 },
      { id: 'cat_epaulettes', name: 'Epaulettes & wings', count: 644 },
      { id: 'cat_jackets', name: 'Flight jackets', count: 412 },
    ],
  },
  { id: 'cat_eyewear', name: 'Eyewear', count: 980 },
  { id: 'cat_manuals', name: 'Manuals & charts', count: 760 },
  { id: 'cat_photography', name: 'Photography prints', count: 1406 },
]

export const categoryAttributes: CategoryAttribute[] = [
  { name: 'Size', type: 'size_chart', required: true, filterable: true, values: 'Linked: Men’s shirts (collar)' },
  { name: 'Sleeve', type: 'single_select', required: true, filterable: true, values: 'Short · Long' },
  { name: 'Airline / issuer', type: 'single_select', required: false, filterable: true, values: '42 values' },
  { name: 'Colour', type: 'swatch', required: true, filterable: true, values: 'White · Light blue · Navy' },
  { name: 'Rank stripes included', type: 'boolean', required: false, filterable: false, values: '—' },
]

export const sizeChart: SizeChart = {
  name: 'Men’s shirts (collar)',
  unit: 'cm',
  columns: ['Size', 'Collar', 'Chest', 'Waist', 'Sleeve', 'Fit Kit match tolerance'],
  rows: [
    ['S', '37–38', '92–97', '80–85', '84', '± 2 cm chest'],
    ['M', '39–40', '98–104', '86–92', '86', '± 2 cm chest'],
    ['L', '41–42', '105–112', '93–100', '88', '± 2 cm chest'],
    ['XL', '43–44', '113–120', '101–108', '90', '± 3 cm chest'],
  ],
}

/* ── Analytics ─────────────────────────────────────────────── */
export const analytics: AnalyticsOverview = {
  periodLabel: 'Jul 1 – Jul 31, 2026 · compared with June',
  funnel: [
    { label: 'Visited listing', value: 148210, percent: 100 },
    { label: 'Added to cart / offer', value: 18402, percent: 12.4 },
    { label: 'Started checkout', value: 7960, percent: 5.4 },
    { label: 'Paid into escrow', value: 4118, percent: 2.8 },
    { label: 'Confirmed landed', value: 3902, percent: 2.6 },
  ],
  gmvByCategory: [
    { label: 'Headsets', share: 34, tone: 'navy' },
    { label: 'Avionics & GPS', share: 27, tone: 'slate' },
    { label: 'Apparel', share: 16, tone: 'gold' },
    { label: 'Flight bags', share: 9, tone: 'green' },
    { label: 'Prints', share: 7, tone: 'brown' },
    { label: 'Other', share: 7, tone: 'grey' },
  ],
  cohorts: [
    { month: 'Feb 2026', values: [100, 64, 52, 47, 44, 41] },
    { month: 'Mar 2026', values: [100, 66, 55, 49, 46] },
    { month: 'Apr 2026', values: [100, 69, 57, 51] },
    { month: 'May 2026', values: [100, 71, 60] },
    { month: 'Jun 2026', values: [100, 73] },
    { month: 'Jul 2026', values: [100] },
  ],
  trustSafety: [
    { label: 'KYC approval rate', value: '91.2%' },
    { label: 'Median KYC review time', value: '5h 40m' },
    { label: 'Disputes per 1,000 orders', value: '8.4' },
    { label: 'Buyer-favoured outcomes', value: '58%' },
    { label: 'Fraud loss (chargebacks)', value: '$1,120 · 0.23%' },
    { label: 'Fit Kit return rate (apparel)', value: '3.1% vs 9.8% without' },
  ],
}

/* ── Team & roles ──────────────────────────────────────────── */
const all = (level: 'manage' | 'view' | 'none') =>
  ({ view: level, users: level, kyc: level, listings: level, orders: level, refunds: level, disputes: level, payouts: level, fees: level, content: level, team: level }) as StaffRole['matrix']

export const staffRoles: StaffRole[] = [
  { id: 'role_super', name: 'Super admin', members: 2, matrix: all('manage') },
  { id: 'role_ts', name: 'Trust & safety', members: 4, matrix: { ...all('none'), view: 'manage', users: 'manage', kyc: 'manage', listings: 'manage', orders: 'view', disputes: 'manage', payouts: 'view' } },
  { id: 'role_fin', name: 'Finance', members: 2, matrix: { ...all('none'), view: 'manage', users: 'view', orders: 'manage', refunds: 'manage', disputes: 'view', payouts: 'manage', fees: 'manage' } },
  { id: 'role_support', name: 'Support agent', members: 4, matrix: { ...all('none'), view: 'manage', users: 'view', kyc: 'view', listings: 'view', orders: 'view', disputes: 'view' } },
  { id: 'role_mkt', name: 'Marketing', members: 2, matrix: { ...all('none'), view: 'manage', listings: 'view', content: 'manage' } },
]

export const staffMembers: StaffMember[] = [
  { id: 'stf_1', name: 'Tolu Adeyemi', initials: 'TA', email: 'tolu.adeyemi@pilotwardrobe.com', roleName: 'Super admin', twoFactor: 'Security key', lastActive: 'Now', status: 'active' },
  { id: 'stf_2', name: 'Amaka Nwosu', initials: 'AN', email: 'amaka.n@pilotwardrobe.com', roleName: 'Trust & safety', twoFactor: 'Security key', lastActive: '12 min ago', status: 'active' },
  { id: 'stf_3', name: 'Jide Ogun', initials: 'JO', email: 'jide.o@pilotwardrobe.com', roleName: 'Support agent', twoFactor: 'Authenticator', lastActive: '2h ago', status: 'active' },
  { id: 'stf_4', name: 'Femi Bakare', initials: 'FB', email: 'femi.b@pilotwardrobe.com', roleName: 'Finance', twoFactor: '—', lastActive: 'Invite sent Jul 30', status: 'invited' },
]

/* ── Audit ─────────────────────────────────────────────────── */
export const auditLog: AuditEntry[] = [
  { id: 'au_1', at: hoursAgo(0.2), actor: { name: 'Amaka N.', initials: 'AN', system: false }, action: 'ORDER.REFUND.REQUESTED', tone: 'danger', target: '#PW-4479', details: 'Full refund $2,235.00 · reason fraud · 2nd approver pending', ip: '102.89.4.12' },
  { id: 'au_2', at: hoursAgo(0.25), actor: { name: 'Amaka N.', initials: 'AN', system: false }, action: 'USER.SUSPENDED', tone: 'danger', target: 'U-12409', details: 'Linked to suspended U-08812 · device graph', ip: '102.89.4.12' },
  { id: 'au_3', at: hoursAgo(0.7), actor: { name: 'Amaka N.', initials: 'AN', system: false }, action: 'DISPUTE.MESSAGE', tone: 'info', target: 'DS-2041', details: 'Requested pre-dispatch label photo from seller', ip: '102.89.4.12' },
  { id: 'au_4', at: hoursAgo(1.1), actor: { name: 'Tolu A.', initials: 'TA', system: false }, action: 'FEE_RULE.CREATED', tone: 'warning', target: 'FR-0019', details: 'Ghana launch promo 5% · scheduled Jul 1 – Sep 30', ip: '197.210.1.8' },
  { id: 'au_5', at: hoursAgo(1.5), actor: { name: 'Jide O.', initials: 'JO', system: false }, action: 'KYC.APPROVED', tone: 'success', target: 'KY-7712', details: 'Zainab Ali · pilot licence + NIN', ip: '41.58.20.7' },
  { id: 'au_6', at: hoursAgo(7.8), actor: { name: 'System', initials: '⚙', system: true }, action: 'ORDER.AUTO_HOLD', tone: 'danger', target: '#PW-4479', details: 'Risk rule R-12 velocity (score 87)', ip: null },
  { id: 'au_7', at: hoursAgo(11), actor: { name: 'System', initials: '⚙', system: true }, action: 'ESCROW.AUTO_RELEASE', tone: 'success', target: '41 orders', details: '72h window elapsed · $9,842.10 released', ip: null },
  { id: 'au_8', at: hoursAgo(16), actor: { name: 'Tolu A.', initials: 'TA', system: false }, action: 'ROLE.UPDATED', tone: 'warning', target: 'Support agent', details: 'Removed Refunds: manage', ip: '197.210.1.8' },
]

/* ── Settings ──────────────────────────────────────────────── */
export const platformSettings: PlatformSettings = {
  markets: [
    { countryCode: 'NG', name: 'Nigeria', detail: 'NGN · Paystack · KYC: Smile ID', enabled: true, status: 'live' },
    { countryCode: 'GH', name: 'Ghana', detail: 'GHS · Paystack + MoMo · KYC: Smile ID', enabled: true, status: 'live' },
    { countryCode: 'GB', name: 'United Kingdom', detail: 'GBP · Wise · KYC: Onfido', enabled: true, status: 'live' },
    { countryCode: 'US', name: 'United States', detail: 'USD · Stripe · KYC: Onfido', enabled: false, status: 'beta' },
  ],
  displayCurrencies: ['USD', 'NGN', 'GHS', 'GBP', 'EUR'],
  settlementCurrency: 'USD',
  fxMarginPercent: 1.5,
  featureFlags: [
    { key: 'fit_kit', label: 'Fit Kit size matching', detail: '100% · all markets', enabled: true },
    { key: 'swaps_cash', label: 'Swaps with cash top-up', detail: '100%', enabled: true },
    { key: 'ai_price', label: 'AI price check', detail: '50% · experiment PW-EXP-14', enabled: true },
    { key: 'instant_payouts', label: 'Instant payouts', detail: 'Off · pending PSP approval', enabled: false },
    { key: 'photo_licensing', label: 'Photographer licensing', detail: 'NG, GH only', enabled: true },
  ],
  gateways: [
    { code: 'paystack', name: 'Paystack', enabled: true, currencies: ['NGN', 'GHS', 'USD'], countries: ['NG', 'GH'], mode: 'live', publicKeyMasked: 'pk_live_••••3f1a', webhookStatus: 'healthy' },
    { code: 'flutterwave', name: 'Flutterwave', enabled: true, currencies: ['NGN', 'GHS', 'USD'], countries: ['NG', 'GH', 'KE'], mode: 'live', publicKeyMasked: 'FLWPUBK-••••-X', webhookStatus: 'healthy' },
    { code: 'monnify', name: 'Monnify', enabled: true, currencies: ['NGN'], countries: ['NG'], mode: 'live', publicKeyMasked: 'MK_PROD_••••QW', webhookStatus: 'healthy' },
    { code: 'stripe', name: 'Stripe', enabled: true, currencies: ['USD', 'GBP', 'EUR'], countries: ['GB', 'US'], mode: 'test', publicKeyMasked: 'pk_test_••••9Zx', webhookStatus: 'healthy' },
    { code: 'paypal', name: 'PayPal', enabled: false, currencies: ['USD', 'GBP', 'EUR'], countries: ['GB', 'US'], mode: 'test', publicKeyMasked: null, webhookStatus: 'unconfigured' },
  ],
  maintenance: { scheduled: false, window: null },
}

/* ── Overview ──────────────────────────────────────────────── */
export function overview(name: string): AdminOverview {
  const series = Array.from({ length: 31 }, (_, i) => {
    const base = 12000 + i * 520 + Math.round(Math.sin(i / 2) * 1800)
    return { date: `2026-07-${String(i + 1).padStart(2, '0')}`, gmv: base, orders: Math.round(base / 118 + Math.cos(i) * 6) }
  })
  return {
    greetingName: name,
    periodLabel: 'figures in USD · last 30 days vs previous',
    kpis: [
      { key: 'gmv', label: 'Gross merchandise value', value: '$482,910', delta: '+18.2%', trend: 'up', positive: true, sparkline: [4, 5, 5, 6, 5, 7, 8, 8, 9, 10] },
      { key: 'escrow', label: 'Held in escrow', value: '$96,420', delta: '412 orders', trend: 'flat', positive: true, caption: '412 orders', sparkline: [6, 6, 7, 6, 7, 7, 8, 7, 8, 8] },
      { key: 'revenue', label: 'Platform revenue', value: '$38,632', delta: '+21.4%', trend: 'up', positive: true, sparkline: [3, 4, 4, 5, 6, 6, 7, 8, 8, 9] },
      { key: 'active_users', label: 'Active users (30d)', value: '12,418', delta: '+9.1%', trend: 'up', positive: true, sparkline: [5, 5, 6, 6, 6, 7, 7, 7, 8, 8] },
      { key: 'dispute_rate', label: 'Dispute rate', value: '0.84%', delta: '−0.12pt', trend: 'down', positive: true, sparkline: [9, 8, 9, 7, 8, 6, 7, 5, 6, 5] },
    ],
    series,
    queues: [
      { key: 'kyc', label: 'KYC reviews', detail: '12 over 24h SLA', count: 38, to: '/admin/kyc', permission: 'kyc.view' },
      { key: 'disputes', label: 'Open disputes', detail: '2 due today', count: 6, to: '/admin/disputes', permission: 'disputes.view' },
      { key: 'reports', label: 'Reports & flags', detail: '3 counterfeit claims', count: 14, to: '/admin/reports', permission: 'reports.view' },
      { key: 'listings', label: 'Listings to moderate', detail: 'Auto-flagged by rules', count: 9, to: '/admin/listings', permission: 'listings.view' },
      { key: 'payouts', label: 'Payouts to approve', detail: '$41,280 total', count: 21, to: '/admin/payouts', permission: 'payouts.view' },
    ],
    latestOrders: adminOrders.slice(0, 4),
    riskSignals: [
      { id: 'rs_1', title: 'Velocity: 3 high-value buys from new account', detail: '#PW-4479' },
      { id: 'rs_2', title: 'Same device on 4 accounts', detail: 'user_8812 +3' },
      { id: 'rs_3', title: 'Off-platform payment phrases', detail: '2 conversations' },
    ],
    systemStatus: 'normal',
  }
}
