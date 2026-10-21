import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/permissions'

const STAFF = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const

/** Lazy views — each page is its own chunk (route-level code splitting). */
const pub = {
  home: () => import('@/views/public/HomePage.vue'),
  marketplace: () => import('@/views/public/MarketplacePage.vue'),
  listing: () => import('@/views/public/ListingDetailPage.vue'),
  categories: () => import('@/views/public/CategoriesPage.vue'),
  seller: () => import('@/views/public/SellerProfilePage.vue'),
  photographer: () => import('@/views/public/PhotographerStorefrontPage.vue'),
  directory: () => import('@/views/public/DirectoryPage.vue'),
  content: () => import('@/views/public/ContentPage.vue'),
  contact: () => import('@/views/public/ContactPage.vue'),
}

const auth = {
  welcome: () => import('@/views/auth/WelcomePage.vue'),
  login: () => import('@/views/auth/LoginPage.vue'),
  signup: () => import('@/views/auth/SignupPage.vue'),
  verify: () => import('@/views/auth/VerifyEmailPage.vue'),
  twoStep: () => import('@/views/auth/TwoStepPage.vue'),
  forgot: () => import('@/views/auth/ForgotPasswordPage.vue'),
  reset: () => import('@/views/auth/ResetPasswordPage.vue'),
  googleCallback: () => import('@/views/auth/SocialCallbackPage.vue'),
  finishSetup: () => import('@/views/auth/FinishSetupPage.vue'),
  linkAccounts: () => import('@/views/auth/LinkAccountsPage.vue'),
  ready: () => import('@/views/auth/AccountReadyPage.vue'),
}

const acc = {
  overview: () => import('@/views/account/HangarOverviewPage.vue'),
  listings: () => import('@/views/account/ListingsPage.vue'),
  wizard: () => import('@/views/account/ListingWizardPage.vue'),
  orders: () => import('@/views/account/OrdersPage.vue'),
  order: () => import('@/views/account/OrderDetailPage.vue'),
  offers: () => import('@/views/account/OffersSwapsPage.vue'),
  swapBuilder: () => import('@/views/account/SwapBuilderPage.vue'),
  wallet: () => import('@/views/account/WalletPage.vue'),
  reviews: () => import('@/views/account/ReviewsPage.vue'),
  disputes: () => import('@/views/account/DisputesPage.vue'),
  openDispute: () => import('@/views/account/OpenDisputePage.vue'),
  dispute: () => import('@/views/account/DisputeCasePage.vue'),
  fitKit: () => import('@/views/account/FitKitPage.vue'),
  verification: () => import('@/views/account/VerificationPage.vue'),
  aviator: () => import('@/views/account/AviatorCredentialsPage.vue'),
  settings: () => import('@/views/account/SettingsPage.vue'),
  addresses: () => import('@/views/account/AddressesPage.vue'),
  favorites: () => import('@/views/account/FavoritesPage.vue'),
  messages: () => import('@/views/account/MessagesPage.vue'),
  notifications: () => import('@/views/account/NotificationsPage.vue'),
  cart: () => import('@/views/account/CartPage.vue'),
}

const co = {
  checkout: () => import('@/views/checkout/CheckoutPage.vue'),
  callback: () => import('@/views/checkout/PaymentCallbackPage.vue'),
  mockGateway: () => import('@/views/checkout/MockGatewayPage.vue'),
  confirmation: () => import('@/views/checkout/OrderConfirmationPage.vue'),
}

const adm = {
  signIn: () => import('@/views/admin/StaffSignInPage.vue'),
  overview: () => import('@/views/admin/AdminOverviewPage.vue'),
  users: () => import('@/views/admin/AdminUsersPage.vue'),
  user: () => import('@/views/admin/AdminUserDetailPage.vue'),
  kyc: () => import('@/views/admin/AdminKycPage.vue'),
  listings: () => import('@/views/admin/AdminModerationPage.vue'),
  orders: () => import('@/views/admin/AdminOrdersPage.vue'),
  order: () => import('@/views/admin/AdminOrderDetailPage.vue'),
  disputes: () => import('@/views/admin/AdminDisputesPage.vue'),
  reports: () => import('@/views/admin/AdminReportsPage.vue'),
  payouts: () => import('@/views/admin/AdminPayoutsPage.vue'),
  fees: () => import('@/views/admin/AdminFeesPage.vue'),
  promotions: () => import('@/views/admin/AdminPromotionsPage.vue'),
  broadcasts: () => import('@/views/admin/AdminBroadcastsPage.vue'),
  content: () => import('@/views/admin/AdminContentPage.vue'),
  catalogue: () => import('@/views/admin/AdminCataloguePage.vue'),
  analytics: () => import('@/views/admin/AdminAnalyticsPage.vue'),
  team: () => import('@/views/admin/AdminTeamPage.vue'),
  audit: () => import('@/views/admin/AdminAuditLogPage.vue'),
  settings: () => import('@/views/admin/AdminSettingsPage.vue'),
}

const err = {
  forbidden: () => import('@/views/errors/ForbiddenPage.vue'),
  notFound: () => import('@/views/errors/NotFoundPage.vue'),
  sessionExpired: () => import('@/views/errors/SessionExpiredPage.vue'),
  serverError: () => import('@/views/errors/ServerErrorPage.vue'),
  maintenance: () => import('@/views/errors/MaintenancePage.vue'),
  offline: () => import('@/views/errors/OfflinePage.vue'),
}

export const routes: RouteRecordRaw[] = [
  /* ── Public marketplace (visitor-safe) ─────────────────────────────── */
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      { path: '', name: 'home', component: pub.home, meta: { title: 'Buy, sell or swap premium aviation gear' } },
      { path: 'marketplace', name: 'marketplace', component: pub.marketplace, meta: { nav: 'marketplace', title: 'Marketplace' } },
      { path: 'marketplace/:slug', name: 'listing', component: pub.listing, meta: { nav: 'marketplace' } },
      { path: 'listing/:slug', redirect: (to) => ({ name: 'listing', params: to.params }) },
      { path: 'categories', name: 'categories', component: pub.categories, meta: { nav: 'marketplace', title: 'All categories' } },
      { path: 'category/:slug', name: 'category', component: pub.marketplace, meta: { nav: 'marketplace' } },
      { path: 'search', redirect: (to) => ({ name: 'marketplace', query: { ...to.query, search: to.query.q ?? to.query.search } }) },
      { path: 'digital-products', name: 'digital-products', redirect: { name: 'marketplace', query: { format: 'digital' } } },
      { path: 'seller/:username', name: 'seller', component: pub.seller, meta: { nav: 'marketplace' } },
      { path: 'aviators', name: 'aviators', component: pub.directory, props: { type: 'aviator' }, meta: { title: 'Verified aviators' } },
      { path: 'photographers', name: 'photographers', component: pub.directory, props: { type: 'photographer' }, meta: { nav: 'photographers', title: 'Aviation photographers' } },
      { path: 'photographers/:username', name: 'photographer', component: pub.photographer, meta: { nav: 'photographers' } },
      { path: 'photography', redirect: { name: 'photographers' } },
      { path: 'about', name: 'about', component: pub.content, props: { slug: 'about' } },
      { path: 'how-it-works', name: 'how-it-works', component: pub.content, props: { slug: 'how-it-works' } },
      { path: 'faq', name: 'faq', component: pub.content, props: { slug: 'faq' } },
      { path: 'terms', name: 'terms', component: pub.content, props: { slug: 'terms' } },
      { path: 'privacy', name: 'privacy', component: pub.content, props: { slug: 'privacy' } },
      { path: 'cookies', name: 'cookies', component: pub.content, props: { slug: 'cookies' } },
      { path: 'help/:slug', name: 'help', component: pub.content, props: true },
      { path: 'contact', name: 'contact', component: pub.contact, meta: { title: 'Contact us' } },

      /* ── Authenticated consumer areas sharing the public header ── */
      { path: 'sell', name: 'sell', redirect: { name: 'listing-new' }, meta: { nav: 'sell' } },
      { path: 'cart', name: 'cart', component: acc.cart, meta: { requiresAuth: true, title: 'Cart', noindex: true } },
      { path: 'swap/:slug', name: 'swap-builder', component: acc.swapBuilder, meta: { requiresAuth: true, permission: 'swaps.create', requiresKyc: true, nav: 'marketplace', title: 'Propose a swap', noindex: true } },
      { path: 'messages/:conversationId?', name: 'messages', component: acc.messages, meta: { requiresAuth: true, title: 'Messages', noindex: true, nav: 'hangar' } },
      { path: 'notifications', name: 'notifications', component: acc.notifications, meta: { requiresAuth: true, title: 'Notifications', noindex: true, nav: 'hangar' } },
      { path: 'orders/:id/confirmed', name: 'order-confirmed', component: co.confirmation, meta: { requiresAuth: true, title: 'Cleared for takeoff', noindex: true } },
      { path: 'payment/callback', name: 'payment-callback', component: co.callback, meta: { requiresAuth: true, title: 'Confirming payment', noindex: true } },
    ],
  },

  /* ── My Hangar (account) ───────────────────────────────────────────── */
  {
    path: '/hangar',
    component: () => import('@/layouts/AccountLayout.vue'),
    meta: { requiresAuth: true, noindex: true, nav: 'hangar' },
    children: [
      { path: '', name: 'hangar', component: acc.overview, meta: { title: 'My Hangar' } },
      { path: 'listings', name: 'hangar-listings', component: acc.listings, meta: { title: 'Listings' } },
      { path: 'listings/new', name: 'listing-new', component: acc.wizard, meta: { title: 'List an item', permission: 'listings.create', nav: 'sell', fullWidth: true } },
      { path: 'listings/:id/edit', name: 'listing-edit', component: acc.wizard, meta: { title: 'Edit listing', permission: 'listings.update', fullWidth: true } },
      { path: 'orders', name: 'hangar-orders', component: acc.orders, meta: { title: 'Orders' } },
      { path: 'orders/:id', name: 'hangar-order', component: acc.order, meta: { title: 'Order' } },
      { path: 'offers', name: 'hangar-offers', component: acc.offers, meta: { title: 'Offers & swaps' } },
      { path: 'wallet', name: 'hangar-wallet', component: acc.wallet, meta: { title: 'Wallet' } },
      { path: 'reviews', name: 'hangar-reviews', component: acc.reviews, meta: { title: 'Reviews' } },
      { path: 'disputes', name: 'hangar-disputes', component: acc.disputes, meta: { title: 'Disputes' } },
      { path: 'disputes/new', name: 'dispute-new', component: acc.openDispute, meta: { title: 'Open a dispute', permission: 'disputes.create' } },
      { path: 'disputes/:id', name: 'hangar-dispute', component: acc.dispute, meta: { title: 'Dispute' } },
      { path: 'fit-kit', name: 'hangar-fit-kit', component: acc.fitKit, meta: { title: 'Fit Kit' } },
      { path: 'verification', name: 'hangar-verification', component: acc.verification, meta: { title: 'Verify your identity' } },
      { path: 'aviator', name: 'hangar-aviator', component: acc.aviator, meta: { title: 'Aviator credentials' } },
      { path: 'addresses', name: 'hangar-addresses', component: acc.addresses, meta: { title: 'Addresses' } },
      { path: 'favorites', name: 'hangar-favorites', component: acc.favorites, meta: { title: 'Saved items' } },
      { path: 'settings/:tab?', name: 'hangar-settings', component: acc.settings, meta: { title: 'Settings' } },
    ],
  },
  { path: '/account/:rest(.*)*', redirect: (to) => `/hangar/${([] as string[]).concat(to.params.rest ?? []).join('/')}` },

  /* ── Checkout (focused layout) ─────────────────────────────────────── */
  {
    path: '/checkout',
    component: () => import('@/layouts/CheckoutLayout.vue'),
    meta: { requiresAuth: true, permission: 'orders.create', noindex: true },
    children: [{ path: '', name: 'checkout', component: co.checkout, meta: { title: 'Secure checkout' } }],
  },
  { path: '/payment/mock-gateway', name: 'mock-gateway', component: co.mockGateway, meta: { requiresAuth: true, noindex: true, title: 'Payment gateway (sandbox)' } },

  /* ── Authentication (/auth/*, VA0) ─────────────────────────────────── */
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { noindex: true },
    children: [
      { path: '', name: 'auth', component: auth.welcome, meta: { guestOnly: true, title: 'Welcome aboard' } },
      { path: 'login', name: 'login', component: auth.login, meta: { guestOnly: true, title: 'Log in' } },
      { path: 'signup', name: 'signup', component: auth.signup, meta: { guestOnly: true, title: 'Create your account' } },
      { path: 'verify', name: 'verify-email', component: auth.verify, meta: { title: 'Check your email' } },
      { path: '2fa', name: 'two-step', component: auth.twoStep, meta: { guestOnly: true, title: 'Two-step verification' } },
      { path: 'forgot', name: 'forgot-password', component: auth.forgot, meta: { guestOnly: true, title: 'Reset your password' } },
      { path: 'reset', name: 'reset-password', component: auth.reset, meta: { title: 'Create a new password' } },
      { path: 'google/callback', name: 'social-callback', component: auth.googleCallback, meta: { title: 'Signing in…' } },
      { path: 'finish-setup', name: 'finish-setup', component: auth.finishSetup, meta: { title: 'Almost cleared' } },
      { path: 'link-accounts', name: 'link-accounts', component: auth.linkAccounts, meta: { title: 'Link your Google account' } },
      { path: 'ready', name: 'account-ready', component: auth.ready, meta: { requiresAuth: true, title: "You're cleared for takeoff" } },
    ],
  },
  /* Brief-compatible aliases */
  { path: '/login', redirect: (to) => ({ name: 'login', query: to.query }) },
  { path: '/register', redirect: (to) => ({ name: 'auth', query: to.query }) },
  { path: '/forgot-password', redirect: { name: 'forgot-password' } },
  { path: '/reset-password', redirect: (to) => ({ name: 'reset-password', query: to.query }) },
  { path: '/verify-email', redirect: (to) => ({ name: 'verify-email', query: to.query }) },

  /* ── Control Tower (admin) ─────────────────────────────────────────── */
  { path: '/admin/sign-in', name: 'admin-sign-in', component: adm.signIn, meta: { guestOnly: true, noindex: true, title: 'Staff sign-in' } },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: STAFF, permission: 'admin.access', noindex: true },
    children: [
      { path: '', redirect: { name: 'admin-overview' } },
      { path: 'overview', alias: 'dashboard', name: 'admin-overview', component: adm.overview, meta: { title: 'Overview', permission: 'dashboard.view' } },
      { path: 'users', name: 'admin-users', component: adm.users, meta: { title: 'Users', permission: 'users.view' } },
      { path: 'aviators', redirect: { name: 'admin-users', query: { tab: 'verified' } } },
      { path: 'users/:id', name: 'admin-user', component: adm.user, meta: { title: 'User', permission: 'users.view' } },
      { path: 'kyc/:id?', alias: 'verifications/:id?', name: 'admin-kyc', component: adm.kyc, meta: { title: 'KYC review', permission: 'kyc.view' } },
      { path: 'listings', name: 'admin-listings', component: adm.listings, meta: { title: 'Listing moderation', permission: 'listings.view' } },
      { path: 'orders', name: 'admin-orders', component: adm.orders, meta: { title: 'Orders & escrow', permission: 'orders.view' } },
      { path: 'orders/:id', name: 'admin-order', component: adm.order, meta: { title: 'Order', permission: 'orders.view' } },
      { path: 'disputes/:id?', name: 'admin-disputes', component: adm.disputes, meta: { title: 'Disputes', permission: 'disputes.view' } },
      { path: 'reports', alias: 'messages/reports', name: 'admin-reports', component: adm.reports, meta: { title: 'Reports & flags', permission: 'reports.view' } },
      { path: 'payouts', alias: ['transactions', 'payments'], name: 'admin-payouts', component: adm.payouts, meta: { title: 'Payouts', permission: 'payouts.view' } },
      { path: 'fees', alias: 'commissions', name: 'admin-fees', component: adm.fees, meta: { title: 'Fees & revenue', permission: 'fees.view' } },
      { path: 'promotions', name: 'admin-promotions', component: adm.promotions, meta: { title: 'Promotions', permission: 'promotions.manage' } },
      { path: 'broadcasts', alias: 'notifications', name: 'admin-broadcasts', component: adm.broadcasts, meta: { title: 'Broadcasts', permission: 'broadcasts.manage' } },
      { path: 'content', name: 'admin-content', component: adm.content, meta: { title: 'Content & pages', permission: 'content.manage' } },
      { path: 'catalogue', alias: 'categories', name: 'admin-catalogue', component: adm.catalogue, meta: { title: 'Catalogue & sizes', permission: 'catalogue.manage' } },
      { path: 'analytics', alias: 'reports/analytics', name: 'admin-analytics', component: adm.analytics, meta: { title: 'Analytics', permission: 'analytics.view' } },
      /* Super-admin areas */
      { path: 'team', alias: ['administrators', 'roles', 'permissions'], name: 'admin-team', component: adm.team, meta: { title: 'Team & roles', permission: 'team.view' } },
      { path: 'audit-log', alias: 'audit-logs', name: 'admin-audit', component: adm.audit, meta: { title: 'Audit log', permission: 'audit.view' } },
      { path: 'settings/:tab?', alias: 'payment-gateways', name: 'admin-settings', component: adm.settings, meta: { title: 'Platform settings', roles: [UserRole.SUPER_ADMIN], permission: 'settings.manage' } },
    ],
  },

  /* ── System states ─────────────────────────────────────────────────── */
  { path: '/403', name: 'forbidden', component: err.forbidden, meta: { title: 'Access denied', noindex: true } },
  { path: '/419', name: 'session-expired', component: err.sessionExpired, meta: { title: 'Session expired', noindex: true } },
  { path: '/500', name: 'server-error', component: err.serverError, meta: { title: 'Something went wrong', noindex: true } },
  { path: '/maintenance', name: 'maintenance', component: err.maintenance, meta: { title: 'Scheduled maintenance', noindex: true } },
  { path: '/offline', name: 'offline', component: err.offline, meta: { title: "You're offline", noindex: true } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: err.notFound, meta: { title: 'Off the flight plan', noindex: true } },
]
