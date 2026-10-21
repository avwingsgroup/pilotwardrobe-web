import type {
  AuthUser,
  AviatorApplicationPayload,
  AviatorCredentials,
  Dispute,
  FitKitProfile,
  KycDocumentPayload,
  KycPersonalPayload,
  KycSession,
  NotificationPreference,
  OpenDisputePayload,
  PayoutMethod,
  PayoutSchedule,
  SecurityOverview,
  SellerProfile,
  UserReview,
  WalletBalance,
  WalletTransaction,
  WithdrawalPayload,
  WithdrawalQuote,
  HangarSummary,
  Listing,
  PublicSeller,
} from '@/types'
import { api } from './client'

export interface ProfileUpdate {
  firstName?: string
  lastName?: string
  username?: string
  phone?: string
  bio?: string
  countryCode?: string
  currency?: string
  locale?: string
  avatarMediaId?: string | null
}

export const userService = {
  updateProfile(payload: ProfileUpdate) {
    return api.patch<AuthUser>('/me', payload)
  },
  security(signal?: AbortSignal) {
    return api.get<SecurityOverview>('/me/security', { signal })
  },
  changePassword(payload: { currentPassword: string; password: string; passwordConfirmation: string }) {
    return api.put<void>('/me/password', payload)
  },
  revokeSession(id: string) {
    return api.delete(`/me/sessions/${id}`)
  },
  revokeOtherSessions() {
    return api.post<void>('/me/sessions/logout-others')
  },
  disconnectProvider(provider: string) {
    return api.delete(`/me/social/${provider}`)
  },
  deactivate() {
    return api.post<void>('/me/deactivate')
  },
  deleteAccount(password: string) {
    return api.delete('/me', { data: { password } })
  },
  notificationPreferences(signal?: AbortSignal) {
    return api.get<NotificationPreference[]>('/me/notification-preferences', { signal })
  },
  updateNotificationPreferences(preferences: NotificationPreference[]) {
    return api.put<NotificationPreference[]>('/me/notification-preferences', { preferences })
  },
  reviews(role: 'received' | 'given', signal?: AbortSignal) {
    return api.list<UserReview>('/me/reviews', { params: { role }, signal })
  },
}

export const fitKitService = {
  list(signal?: AbortSignal) {
    return api.get<FitKitProfile[]>('/me/fit-kit', { signal })
  },
  create(profile: Omit<FitKitProfile, 'id' | 'updatedAt' | 'ordersUsedOn'>) {
    return api.post<FitKitProfile>('/me/fit-kit', profile)
  },
  update(id: string, profile: Partial<FitKitProfile>) {
    return api.patch<FitKitProfile>(`/me/fit-kit/${id}`, profile)
  },
  remove(id: string) {
    return api.delete(`/me/fit-kit/${id}`)
  },
}

export const sellerService = {
  profile(username: string, signal?: AbortSignal) {
    return api.get<SellerProfile>(`/sellers/${encodeURIComponent(username)}`, { signal })
  },
  listings(username: string, query: { status?: 'active' | 'sold'; category?: string; sort?: string; page?: number }, signal?: AbortSignal) {
    return api.list<Listing>(`/sellers/${encodeURIComponent(username)}/listings`, { params: query, signal })
  },
  reviews(username: string, page = 1, signal?: AbortSignal) {
    return api.list<UserReview>(`/sellers/${encodeURIComponent(username)}/reviews`, { params: { page }, signal })
  },
  directory(type: 'aviator' | 'photographer' | 'all', page = 1, signal?: AbortSignal) {
    return api.list<PublicSeller>('/sellers', { params: { type, page }, signal })
  },
  follow(username: string) {
    return api.post<{ followers: number }>(`/sellers/${encodeURIComponent(username)}/follow`)
  },
  unfollow(username: string) {
    return api.delete<{ followers: number }>(`/sellers/${encodeURIComponent(username)}/follow`)
  },
}

export const verificationService = {
  kyc(signal?: AbortSignal) {
    return api.get<KycSession>('/me/kyc', { signal })
  },
  savePersonal(payload: KycPersonalPayload) {
    return api.post<KycSession>('/me/kyc/personal', payload)
  },
  saveDocument(payload: KycDocumentPayload) {
    return api.post<KycSession>('/me/kyc/document', payload)
  },
  submit() {
    return api.post<KycSession>('/me/kyc/submit')
  },
  aviator(signal?: AbortSignal) {
    return api.get<AviatorCredentials | null>('/me/aviator', { signal })
  },
  applyAviator(payload: AviatorApplicationPayload) {
    return api.post<AviatorCredentials>('/me/aviator', payload)
  },
}

export const hangarService = {
  summary(signal?: AbortSignal) {
    return api.get<HangarSummary>('/me/hangar', { signal })
  },
}

export const walletService = {
  balance(signal?: AbortSignal) {
    return api.get<WalletBalance>('/me/wallet', { signal })
  },
  transactions(query: { type?: string; month?: string; page?: number }, signal?: AbortSignal) {
    return api.list<WalletTransaction>('/me/wallet/transactions', { params: query, signal })
  },
  payoutMethods(signal?: AbortSignal) {
    return api.get<PayoutMethod[]>('/me/payout-methods', { signal })
  },
  addPayoutMethod(payload: { kind: PayoutMethod['kind']; currency: PayoutMethod['currency']; institution: string; accountNumber: string; accountName: string; twoFactorCode: string }) {
    return api.post<PayoutMethod>('/me/payout-methods', payload)
  },
  payoutSchedule(signal?: AbortSignal) {
    return api.get<PayoutSchedule>('/me/payout-schedule', { signal })
  },
  updatePayoutSchedule(schedule: Partial<PayoutSchedule>) {
    return api.put<PayoutSchedule>('/me/payout-schedule', schedule)
  },
  quoteWithdrawal(payload: Omit<WithdrawalPayload, 'twoFactorCode'>) {
    return api.post<WithdrawalQuote>('/me/withdrawals/quote', payload)
  },
  withdraw(payload: WithdrawalPayload) {
    return api.post<WalletTransaction>('/me/withdrawals', payload)
  },
  statementUrl(month: string) {
    return api.post<{ url: string; expiresAt: string }>('/me/wallet/statements', { month })
  },
}

export const disputeService = {
  list(signal?: AbortSignal) {
    return api.get<Dispute[]>('/me/disputes', { signal })
  },
  get(id: string, signal?: AbortSignal) {
    return api.get<Dispute>(`/disputes/${id}`, { signal })
  },
  open(payload: OpenDisputePayload) {
    return api.post<Dispute>('/disputes', payload)
  },
  reply(id: string, body: string, attachmentIds: string[] = []) {
    return api.post<Dispute>(`/disputes/${id}/messages`, { body, attachmentIds })
  },
  withdraw(id: string) {
    return api.post<Dispute>(`/disputes/${id}/withdraw`)
  },
  respondToProposal(id: string, accept: boolean) {
    return api.post<Dispute>(`/disputes/${id}/proposal/${accept ? 'accept' : 'decline'}`)
  },
}
