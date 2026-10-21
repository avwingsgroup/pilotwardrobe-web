import type {
  AdminDisputeDetail,
  AdminDisputeRow,
  AdminOrderDetail,
  AdminOrderRow,
  AdminOverview,
  AdminQuery,
  AdminUserDetail,
  AdminUserRow,
  AnalyticsOverview,
  AuditEntry,
  BroadcastDraft,
  Campaign,
  CatalogueNode,
  CategoryAttribute,
  CommissionRule,
  DisputeDecisionPayload,
  EscrowStats,
  FeesOverview,
  HeroSlide,
  KycCaseDetail,
  KycCaseRow,
  ModerationItem,
  PaginatedResponse,
  PaginationMeta,
  PayoutRow,
  PayoutStats,
  PlatformSettings,
  PromoCode,
  RefundPayload,
  ReportRow,
  SizeChart,
  StaffMember,
  StaffRole,
} from '@/types'
import { api, http } from './client'

/** Paginated admin table response with optional tab counts. */
export interface AdminTableResponse<T> extends PaginatedResponse<T> {
  meta: PaginationMeta & { counts?: Record<string, number> }
}

async function table<T>(url: string, query: AdminQuery, signal?: AbortSignal): Promise<AdminTableResponse<T>> {
  const res = await http.get<AdminTableResponse<T>>(url, { params: query, signal })
  return res.data
}

/**
 * Control Tower services. Every write is permission-checked server-side and
 * appended to the audit log; values over dual-control thresholds return 202 with
 * `{ status: "pending_approval" }` instead of executing immediately.
 */
export interface DualControlResult {
  status: 'executed' | 'pending_approval'
  approver?: string | null
}

export const adminService = {
  overview(range: string, signal?: AbortSignal) {
    return api.get<AdminOverview>('/admin/overview', { params: { range }, signal })
  },
  exportCsv(resource: string, query: AdminQuery) {
    return api.post<{ url: string }>(`/admin/exports`, { resource, query })
  },

  /* Users */
  users: (q: AdminQuery, s?: AbortSignal) => table<AdminUserRow>('/admin/users', q, s),
  user: (id: string, s?: AbortSignal) => api.get<AdminUserDetail>(`/admin/users/${id}`, { signal: s }),
  suspendUser: (id: string, reason: string) => api.post<AdminUserDetail>(`/admin/users/${id}/suspend`, { reason }),
  reinstateUser: (id: string) => api.post<AdminUserDetail>(`/admin/users/${id}/reinstate`),
  restrictUser: (id: string, reason: string) => api.post<AdminUserDetail>(`/admin/users/${id}/restrict`, { reason }),
  updateLimits: (id: string, limits: Partial<AdminUserDetail['limits']>) =>
    api.patch<AdminUserDetail>(`/admin/users/${id}/limits`, limits),
  addNote: (id: string, body: string) => api.post<AdminUserDetail>(`/admin/users/${id}/notes`, { body }),
  impersonate: (id: string) => api.post<{ url: string; expiresAt: string }>(`/admin/users/${id}/impersonate`),
  inviteUser: (payload: { email: string; name: string }) => api.post<{ invited: true }>('/admin/users/invitations', payload),
  assignRole: (id: string, role: string) => api.post<AdminUserDetail>(`/admin/users/${id}/role`, { role }),

  /* KYC */
  kycQueue: (q: AdminQuery, s?: AbortSignal) => table<KycCaseRow>('/admin/kyc', q, s),
  kycCase: (id: string, s?: AbortSignal) => api.get<KycCaseDetail>(`/admin/kyc/${id}`, { signal: s }),
  kycDecision: (id: string, decision: 'approve' | 'reject' | 'escalate' | 'request_info', reason?: string) =>
    api.post<KycCaseDetail>(`/admin/kyc/${id}/${decision.replace('_', '-')}`, { reason }),

  /* Listing moderation */
  moderation: (q: AdminQuery, s?: AbortSignal) => table<ModerationItem>('/admin/moderation', q, s),
  moderate: (ids: string[], action: 'approve' | 'request_changes' | 'remove', note?: string) =>
    api.post<{ updated: number }>('/admin/moderation/decisions', { ids, action, note }),

  /* Orders & escrow */
  orders: (q: AdminQuery, s?: AbortSignal) => table<AdminOrderRow>('/admin/orders', q, s),
  escrowStats: (s?: AbortSignal) => api.get<EscrowStats>('/admin/orders/stats', { signal: s }),
  order: (id: string, s?: AbortSignal) => api.get<AdminOrderDetail>(`/admin/orders/${id}`, { signal: s }),
  refund: (id: string, payload: RefundPayload) => api.post<DualControlResult>(`/admin/orders/${id}/refund`, payload),
  releaseEscrow: (id: string) => api.post<DualControlResult>(`/admin/orders/${id}/release`),
  holdOrder: (id: string, reason: string) => api.post<AdminOrderDetail>(`/admin/orders/${id}/hold`, { reason }),
  reconcile: () => api.post<{ jobId: string }>('/admin/orders/reconcile'),

  /* Disputes */
  disputes: (q: AdminQuery, s?: AbortSignal) => table<AdminDisputeRow>('/admin/disputes', q, s),
  dispute: (id: string, s?: AbortSignal) => api.get<AdminDisputeDetail>(`/admin/disputes/${id}`, { signal: s }),
  disputeMessage: (id: string, body: string, audience: 'both' | 'buyer' | 'seller' | 'internal') =>
    api.post<AdminDisputeDetail>(`/admin/disputes/${id}/messages`, { body, audience }),
  disputeDecision: (id: string, payload: DisputeDecisionPayload) =>
    api.post<DualControlResult>(`/admin/disputes/${id}/decision`, payload),

  /* Reports & flags */
  reports: (q: AdminQuery, s?: AbortSignal) => table<ReportRow>('/admin/reports', q, s),
  reportAction: (id: string, action: string) => api.post<ReportRow>(`/admin/reports/${id}/actions`, { action }),

  /* Payouts */
  payouts: (q: AdminQuery, s?: AbortSignal) => table<PayoutRow>('/admin/payouts', q, s),
  payoutStats: (s?: AbortSignal) => api.get<PayoutStats>('/admin/payouts/stats', { signal: s }),
  approvePayouts: (ids: string[]) => api.post<DualControlResult>('/admin/payouts/approve', { ids }),
  holdPayout: (id: string, reason: string) => api.post<PayoutRow>(`/admin/payouts/${id}/hold`, { reason }),
  rejectPayout: (id: string, reason: string) => api.post<PayoutRow>(`/admin/payouts/${id}/reject`, { reason }),
  runPayoutBatch: () => api.post<{ batchId: string }>('/admin/payouts/batches'),

  /* Fees & revenue */
  fees: (s?: AbortSignal) => api.get<FeesOverview>('/admin/fees', { signal: s }),
  saveCommissionRule: (rule: Partial<CommissionRule>) =>
    rule.id
      ? api.patch<DualControlResult>(`/admin/commission-rules/${rule.id}`, rule)
      : api.post<DualControlResult>('/admin/commission-rules', rule),
  saveEscrowTimings: (timings: Record<string, string>) => api.put<DualControlResult>('/admin/escrow-timings', timings),

  /* Promotions */
  campaigns: (s?: AbortSignal) => api.get<Campaign[]>('/admin/campaigns', { signal: s }),
  promoCodes: (s?: AbortSignal) => api.get<PromoCode[]>('/admin/promo-codes', { signal: s }),
  savePromoCode: (code: Partial<PromoCode>) => api.post<PromoCode>('/admin/promo-codes', code),
  duplicateCampaign: (id: string) => api.post<Campaign>(`/admin/campaigns/${id}/duplicate`),

  /* Broadcasts */
  broadcastReach: (audience: string[]) => api.post<{ reach: number; optedOut: number }>('/admin/broadcasts/reach', { audience }),
  saveBroadcast: (draft: BroadcastDraft) => api.post<BroadcastDraft>('/admin/broadcasts', draft),
  testBroadcast: (draft: BroadcastDraft) => api.post<void>('/admin/broadcasts/test', draft),

  /* Content */
  heroSlides: (s?: AbortSignal) => api.get<HeroSlide[]>('/admin/content/hero-slides', { signal: s }),
  saveHeroSlide: (slide: Partial<HeroSlide>) => api.patch<HeroSlide>(`/admin/content/hero-slides/${slide.id}`, slide),
  reorderHeroSlides: (ids: string[]) => api.put<HeroSlide[]>('/admin/content/hero-slides/order', { ids }),
  publishContent: () => api.post<void>('/admin/content/publish'),

  /* Catalogue */
  catalogue: (s?: AbortSignal) => api.get<CatalogueNode[]>('/admin/catalogue', { signal: s }),
  categoryAttributes: (id: string, s?: AbortSignal) =>
    api.get<{ attributes: CategoryAttribute[]; sizeChart: SizeChart | null; path: string[] }>(
      `/admin/catalogue/${id}`,
      { signal: s },
    ),

  /* Analytics */
  analytics: (segment: string, s?: AbortSignal) => api.get<AnalyticsOverview>('/admin/analytics', { params: { segment }, signal: s }),

  /* Team & roles (Super admin) */
  roles: (s?: AbortSignal) => api.get<StaffRole[]>('/admin/roles', { signal: s }),
  saveRole: (role: Partial<StaffRole>) =>
    role.id ? api.patch<StaffRole>(`/admin/roles/${role.id}`, role) : api.post<StaffRole>('/admin/roles', role),
  members: (s?: AbortSignal) => api.get<StaffMember[]>('/admin/team', { signal: s }),
  inviteMember: (payload: { email: string; name: string; roleId: string }) => api.post<StaffMember>('/admin/team/invitations', payload),
  updateMember: (id: string, payload: { roleId?: string; status?: 'active' | 'suspended' }) =>
    api.patch<StaffMember>(`/admin/team/${id}`, payload),

  /* Audit log */
  auditLog: (q: AdminQuery, s?: AbortSignal) => table<AuditEntry>('/admin/audit-logs', q, s),

  /* Platform settings (Super admin) */
  settings: (s?: AbortSignal) => api.get<PlatformSettings>('/admin/settings', { signal: s }),
  updateSettings: (patch: Partial<PlatformSettings>) => api.patch<DualControlResult>('/admin/settings', patch),
  scheduleMaintenance: (window: { startsAt: string; endsAt: string; message: string }) =>
    api.post<DualControlResult>('/admin/maintenance-windows', window),
}
