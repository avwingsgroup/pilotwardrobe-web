import { mockAccounts, fitKits, addresses, security, notificationPreferences, reviews, aviatorCredentials } from './users.mock'
import { listings, myListingExtras } from './products.mock'
import { orders, cartItems } from './orders.mock'
import { offers, swaps } from './trades.mock'
import { wallet, transactions, payoutMethods, payoutSchedule } from './transactions.mock'
import { conversations, messages } from './messages.mock'
import { notifications } from './notifications.mock'
import { disputes } from './disputes.mock'
import * as admin from './admin.mock'
import type { KycSession } from '@/types/verification'
import type { Payment } from '@/types/payment'
import type { Order } from '@/types/order'

const SESSION_KEY = 'pw.mock.session'

function readSession(): { userId: string | null } {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as { userId: string | null }) : { userId: null }
  } catch {
    return { userId: null }
  }
}

const clone = <T>(v: T): T => structuredClone(v)

/**
 * Mutable in-memory database seeded from the fixtures. Lives for the page
 * lifetime. Persisted to sessionStorage: the session id (so a refresh keeps you
 * signed in) and the commerce state a payment redirect must survive — orders,
 * payments, cart and listing statuses (checkout → gateway → callback are full
 * page loads, exactly as with a real gateway).
 */
export const db = {
  session: readSession(),
  accounts: clone(mockAccounts),
  listings: clone([...listings, ...myListingExtras]),
  orders: clone(orders) as Order[],
  cart: clone(cartItems),
  offers: clone(offers),
  swaps: clone(swaps),
  wallet: clone(wallet),
  transactions: clone(transactions),
  payoutMethods: clone(payoutMethods),
  payoutSchedule: clone(payoutSchedule),
  conversations: clone(conversations),
  messages: clone(messages),
  notifications: clone(notifications),
  disputes: clone(disputes),
  fitKits: clone(fitKits),
  addresses: clone(addresses),
  security: clone(security),
  notificationPreferences: clone(notificationPreferences),
  reviews: clone(reviews),
  aviator: clone(aviatorCredentials),
  favorites: new Set<string>(['lst_004']),
  following: new Set<string>(),
  payments: [] as (Payment & { createdAt: number })[],
  kyc: {
    id: 'kyc_me',
    status: 'not_started',
    step: 'personal_details',
    documentType: null,
    personal: null,
    documentFront: null,
    handoffUrl: 'https://pilotwardrobe.com/k/7Q2X9',
    rejectionReason: null,
    submittedAt: null,
  } as KycSession,
  /** Pending flows */
  twoFactorChallenges: new Map<string, { userId: string; remember: boolean }>(),
  socialPending: new Map<string, { email: string; firstName: string; lastName: string; existingId?: string }>(),
  resetTokens: new Map<string, { email: string; expiresAt: number; used: boolean }>([
    ['demo-reset-token', { email: 'pilot@example.com', expiresAt: Date.now() + 30 * 60_000, used: false }],
    ['expired-token', { email: 'pilot@example.com', expiresAt: Date.now() - 1000, used: false }],
  ]),
  emailOtps: new Map<string, string>(),
  failedLogins: new Map<string, number>(),
  admin: {
    users: clone(admin.adminUsers),
    kyc: clone(admin.kycQueue),
    moderation: clone(admin.moderationItems),
    orders: clone(admin.adminOrders),
    disputes: clone(admin.adminDisputes),
    reports: clone(admin.reports),
    payouts: clone(admin.payouts),
    fees: clone(admin.fees),
    campaigns: clone(admin.campaigns),
    promoCodes: clone(admin.promoCodes),
    heroSlides: clone(admin.heroSlides),
    roles: clone(admin.staffRoles),
    members: clone(admin.staffMembers),
    audit: clone(admin.auditLog),
    settings: clone(admin.platformSettings),
    userNotes: new Map<string, { id: string; author: string; initials: string; body: string; createdAt: string }[]>(),
  },

  setSession(userId: string | null, remember = false) {
    this.session = { userId }
    try {
      sessionStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(SESSION_KEY)
      if (userId) (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify({ userId }))
    } catch {
      /* storage unavailable */
    }
  },
}

const COMMERCE_KEY = 'pw.mock.commerce'

interface CommerceSnapshot {
  orders: Order[]
  payments: (Payment & { createdAt: number })[]
  cart: typeof db.cart
  listingStatus: Record<string, (typeof db.listings)[number]['status']>
}

/** Called by the adapter after every handled request (some reads advance state, e.g. payment verification). */
export function persistCommerce() {
  const snapshot: CommerceSnapshot = {
    orders: db.orders,
    payments: db.payments,
    cart: db.cart,
    listingStatus: Object.fromEntries(db.listings.map((l) => [l.id, l.status])),
  }
  try {
    sessionStorage.setItem(COMMERCE_KEY, JSON.stringify(snapshot))
  } catch {
    /* storage full or unavailable — state stays in memory */
  }
}

function restoreCommerce() {
  try {
    const raw = sessionStorage.getItem(COMMERCE_KEY)
    if (!raw) return
    const snap = JSON.parse(raw) as CommerceSnapshot
    db.orders = snap.orders
    db.payments = snap.payments
    db.cart = snap.cart
    for (const l of db.listings) if (snap.listingStatus[l.id]) l.status = snap.listingStatus[l.id]!
  } catch {
    sessionStorage.removeItem(COMMERCE_KEY)
  }
}

restoreCommerce()

/** Mock-only: initialise the session from storage (used by tests to reset state). */
export function resetMockSession() {
  db.setSession(null)
}
