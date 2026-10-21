import type { AdminDisputeDetail, AuditEntry } from '@/types/admin'
import { db } from '../db'
import { adminOrderDetail, adminUserDetail, analytics, catalogue, categoryAttributes, escrowStats, kycDetail, overview, payoutStats, sizeChart } from '../admin.mock'
import { created, fail, id, notFound, num, ok, on, paginate, requirePermission, str, validation } from '../server'

const REFUND_DUAL_CONTROL = 100000 // $1,000
const PAYOUT_DUAL_CONTROL = 200000 // $2,000

function audit(actor: string, action: string, target: string, details: string, tone: AuditEntry['tone'] = 'info') {
  db.admin.audit.unshift({
    id: id('au'),
    at: new Date().toISOString(),
    actor: { name: actor, initials: actor.split(' ').map((p) => p[0]).join('').slice(0, 2), system: false },
    action,
    tone,
    target,
    details,
    ip: '102.89.4.12',
  })
}

const search = <T>(items: T[], q: string | undefined, fields: (item: T) => string) => {
  const term = str(q).toLowerCase()
  return term ? items.filter((i) => fields(i).toLowerCase().includes(term)) : items
}

on('GET', '/admin/overview', () => {
  const user = requirePermission('dashboard.view')
  return ok(overview(user.firstName))
})

on('POST', '/admin/exports', ({ body }) => {
  requirePermission('admin.access')
  return created({ url: `/exports/${str(body.resource)}-${Date.now()}.csv` }, 'Export queued — the file will download when ready.')
})

/* Users */
on('GET', '/admin/users', ({ query }) => {
  requirePermission('users.view')
  const tab = str(query.tab)
  let items = search(db.admin.users, query.search, (u) => `${u.displayName} ${u.email} ${u.code}`)
  if (tab === 'verified') items = items.filter((u) => u.roleLabel.includes('Verified') || u.roleLabel === 'Aviator')
  if (tab === 'buyers') items = items.filter((u) => u.roleLabel === 'Buyer')
  if (tab === 'photographers') items = items.filter((u) => u.roleLabel === 'Photographer')
  if (tab === 'pending_kyc') items = items.filter((u) => u.kycStatus === 'pending')
  if (tab === 'suspended') items = items.filter((u) => u.status === 'suspended')
  if (query.risk) items = items.filter((u) => u.risk === query.risk)
  if (query.country) items = items.filter((u) => u.countryCode === query.country)
  return paginate(items, query, { counts: { all: 12418, verified: 3206, buyers: 8970, photographers: 186, pending_kyc: 38, suspended: 41 } })
})

on('POST', '/admin/users/invitations', ({ body }) => {
  const user = requirePermission('users.create')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str(body.email))) throw validation({ email: 'Enter a valid email address.' })
  audit(user.displayName, 'USER.INVITED', str(body.email), str(body.name), 'info')
  return created({ invited: true }, 'Invitation sent.')
})

on('GET', '/admin/users/:id', ({ params }) => {
  requirePermission('users.view')
  const row = db.admin.users.find((u) => u.id === params.id)
  if (!row) throw notFound('User')
  const detail = adminUserDetail(row)
  const notes = db.admin.userNotes.get(row.id)
  return ok(notes ? { ...detail, notes: [...notes, ...detail.notes] } : detail)
})

for (const [action, status, permission] of [['suspend', 'suspended', 'users.suspend'], ['reinstate', 'active', 'users.suspend'], ['restrict', 'restricted', 'users.update']] as const) {
  on('POST', `/admin/users/:id/${action}`, ({ params, body }) => {
    const user = requirePermission(permission)
    const row = db.admin.users.find((u) => u.id === params.id)
    if (!row) throw notFound('User')
    if (action !== 'reinstate' && !str(body.reason)) throw validation({ reason: 'A reason is required and is written to the audit log.' })
    row.status = status
    audit(user.displayName, `USER.${action.toUpperCase()}${action.endsWith('e') ? 'D' : 'ED'}`, row.code, str(body.reason) || 'Reinstated', 'danger')
    return ok(adminUserDetail(row))
  })
}

on('PATCH', '/admin/users/:id/limits', ({ params }) => {
  requirePermission('users.update')
  const row = db.admin.users.find((u) => u.id === params.id)
  if (!row) throw notFound('User')
  return ok(adminUserDetail(row), 'Limits updated.')
})

on('POST', '/admin/users/:id/notes', ({ params, body }) => {
  const user = requirePermission('users.update')
  const row = db.admin.users.find((u) => u.id === params.id)
  if (!row) throw notFound('User')
  if (!str(body.body)) throw validation({ body: 'Write a note first.' })
  const list = db.admin.userNotes.get(row.id) ?? []
  list.unshift({ id: id('n'), author: user.displayName, initials: `${user.firstName[0]}${user.lastName[0]}`, body: str(body.body), createdAt: new Date().toISOString() })
  db.admin.userNotes.set(row.id, list)
  return ok({ ...adminUserDetail(row), notes: [...list, ...adminUserDetail(row).notes] })
})

on('POST', '/admin/users/:id/impersonate', ({ params }) => {
  const user = requirePermission('users.impersonate')
  audit(user.displayName, 'USER.IMPERSONATED', params.id!, 'Read-only session · 15 min', 'warning')
  return ok({ url: '/', expiresAt: new Date(Date.now() + 15 * 60_000).toISOString() })
})

on('POST', '/admin/users/:id/role', ({ params, body }) => {
  const user = requirePermission('roles.manage')
  const row = db.admin.users.find((u) => u.id === params.id)
  if (!row) throw notFound('User')
  audit(user.displayName, 'ROLE.ASSIGNED', row.code, `Role → ${str(body.role)}`, 'warning')
  return ok(adminUserDetail(row))
})

/* KYC */
on('GET', '/admin/kyc', ({ query }) => {
  requirePermission('kyc.view')
  const tab = str(query.tab) || 'pending'
  return paginate(db.admin.kyc.filter((k) => k.status === tab), query, { counts: { pending: db.admin.kyc.filter((k) => k.status === 'pending').length, escalated: db.admin.kyc.filter((k) => k.status === 'escalated').length, overSla: 12 } }, 50)
})

on('GET', '/admin/kyc/:id', ({ params }) => {
  requirePermission('kyc.view')
  const row = db.admin.kyc.find((k) => k.id === params.id)
  if (!row) throw notFound('KYC case')
  return ok(kycDetail(row))
})

for (const decision of ['approve', 'reject', 'escalate', 'request-info'] as const) {
  on('POST', `/admin/kyc/:id/${decision}`, ({ params, body }) => {
    const user = requirePermission('kyc.review')
    const row = db.admin.kyc.find((k) => k.id === params.id)
    if (!row) throw notFound('KYC case')
    if (decision === 'reject' && !str(body.reason)) throw validation({ reason: 'Choose a rejection reason.' })
    row.status = decision === 'escalate' ? 'escalated' : 'done'
    audit(user.displayName, `KYC.${decision.toUpperCase().replace('-', '_')}${decision === 'approve' ? 'D' : ''}`, row.code, row.displayName, decision === 'approve' ? 'success' : 'warning')
    return ok(kycDetail(row))
  })
}

/* Moderation */
on('GET', '/admin/moderation', ({ query }) => {
  requirePermission('listings.view')
  const tab = str(query.tab) || 'needs_review'
  return paginate(
    search(db.admin.moderation.filter((m) => tab === 'all' || m.queue === tab), query.search, (m) => `${m.title} ${m.sellerName}`),
    query,
    { counts: { needs_review: db.admin.moderation.filter((m) => m.queue === 'needs_review').length, live: 18204, changes_requested: 22, removed: 311 } },
    24,
  )
})

on('POST', '/admin/moderation/decisions', ({ body }) => {
  const user = requirePermission(body.action === 'approve' ? 'listings.approve' : 'listings.reject')
  const ids = (body.ids as string[]) ?? []
  const map = { approve: 'live', request_changes: 'changes_requested', remove: 'removed' } as const
  const to = map[body.action as keyof typeof map]
  if (!to) throw validation({ action: 'Unknown action.' })
  let updated = 0
  for (const item of db.admin.moderation.filter((m) => ids.includes(m.id))) {
    item.queue = to
    updated++
    audit(user.displayName, `LISTING.${str(body.action).toUpperCase()}`, item.listingId, item.title, body.action === 'approve' ? 'success' : 'warning')
  }
  return ok({ updated })
})

/* Orders & escrow */
on('GET', '/admin/orders', ({ query }) => {
  requirePermission('orders.view')
  let items = search(db.admin.orders, query.search, (o) => `${o.number} ${o.buyerName} ${o.sellerName} ${o.itemTitle}`)
  if (query.status) items = items.filter((o) => o.status === query.status)
  return paginate(items, query)
})
on('GET', '/admin/orders/stats', () => {
  requirePermission('orders.view')
  return ok(escrowStats)
})
on('GET', '/admin/orders/:id', ({ params }) => {
  requirePermission('orders.view')
  const row = db.admin.orders.find((o) => o.id === params.id || o.number === params.id)
  if (!row) throw notFound('Order')
  return ok(adminOrderDetail(row))
})
on('POST', '/admin/orders/:id/refund', ({ params, body }) => {
  const user = requirePermission('transactions.refund')
  const row = db.admin.orders.find((o) => o.id === params.id)
  if (!row) throw notFound('Order')
  if (!str(body.reason)) throw validation({ reason: 'Choose a reason.' })
  const amount = body.type === 'partial' ? num(body.amount) : row.total.amount
  if (amount <= 0 || amount > row.total.amount) throw validation({ amount: 'Enter an amount up to the order total.' })
  const pending = amount > REFUND_DUAL_CONTROL
  audit(user.displayName, 'ORDER.REFUND.REQUESTED', `#${row.number}`, `${body.type === 'partial' ? 'Partial' : 'Full'} refund $${(amount / 100).toFixed(2)} · ${str(body.reason)}${pending ? ' · 2nd approver pending' : ''}`, 'danger')
  if (!pending) {
    row.status = 'refunded'
    row.escrowStatus = 'refunded'
    row.escrowLabel = 'Refunded'
  }
  return ok({ status: pending ? 'pending_approval' : 'executed', approver: pending ? 'Amaka N.' : null }, pending ? 'Refund requested — a second approver must confirm.' : 'Refund issued.')
})
on('POST', '/admin/orders/:id/release', ({ params }) => {
  const user = requirePermission('orders.manage')
  const row = db.admin.orders.find((o) => o.id === params.id)
  if (!row) throw notFound('Order')
  if (row.escrowStatus === 'frozen') throw fail(409, 'INVALID_STATE_TRANSITION', 'Escrow is frozen by an open dispute. Resolve the dispute instead.')
  row.escrowStatus = 'released'
  row.escrowLabel = 'Released'
  audit(user.displayName, 'ESCROW.RELEASED', `#${row.number}`, 'Manual release', 'success')
  return ok({ status: 'executed' }, 'Escrow released to seller.')
})
on('POST', '/admin/orders/:id/hold', ({ params, body }) => {
  const user = requirePermission('orders.manage')
  const row = db.admin.orders.find((o) => o.id === params.id)
  if (!row) throw notFound('Order')
  row.status = 'on_hold'
  row.escrowStatus = 'on_hold'
  row.escrowLabel = 'On hold · manual'
  audit(user.displayName, 'ORDER.HOLD', `#${row.number}`, str(body.reason) || 'Manual hold', 'warning')
  return ok(adminOrderDetail(row))
})
on('POST', '/admin/orders/reconcile', () => {
  requirePermission('orders.manage')
  return ok({ jobId: id('job') }, 'Reconciliation with PSPs started.')
})

/* Disputes */
on('GET', '/admin/disputes', ({ query }) => {
  requirePermission('disputes.view')
  const tab = str(query.tab) || 'mine'
  return paginate(db.admin.disputes.filter((d) => d.bucket === tab), query, { counts: { mine: db.admin.disputes.filter((d) => d.bucket === 'mine').length, unassigned: db.admin.disputes.filter((d) => d.bucket === 'unassigned').length, open: 6 } })
})
on('GET', '/admin/disputes/:id', ({ params }) => {
  requirePermission('disputes.view')
  const row = db.admin.disputes.find((d) => d.id === params.id)
  if (!row) throw notFound('Dispute')
  const full = db.admin.disputes[0]!
  // Only DS-2041 has a fully detailed fixture; others inherit its structure.
  return ok(row.thread ? row : ({ ...full, ...row, orderNumber: `PW-44${row.number.slice(-2)}`, frozen: row.amount } as AdminDisputeDetail))
})
on('POST', '/admin/disputes/:id/messages', ({ params, body }) => {
  const user = requirePermission('disputes.resolve')
  const row = db.admin.disputes.find((d) => d.id === params.id)
  if (!row?.thread) throw notFound('Dispute')
  if (!str(body.body)) throw validation({ body: 'Write a message first.' })
  row.thread.push({ id: id('t'), author: { displayName: 'You', initials: `${user.firstName[0]}${user.lastName[0]}`, role: 'mediator' }, body: str(body.body), internal: body.audience === 'internal', createdAt: new Date().toISOString() })
  audit(user.displayName, 'DISPUTE.MESSAGE', row.number, `${str(body.audience)}: ${str(body.body).slice(0, 60)}`)
  return ok(row)
})
on('POST', '/admin/disputes/:id/decision', ({ params, body }) => {
  const user = requirePermission('disputes.resolve')
  const row = db.admin.disputes.find((d) => d.id === params.id)
  if (!row) throw notFound('Dispute')
  if (!body.decision) throw validation({ decision: 'Choose a decision.' })
  if (!str(body.policyReference)) throw validation({ policy_reference: 'Cite the policy this decision relies on.' })
  const amountToBuyer = num(body.amountToBuyer)
  const pending = amountToBuyer > REFUND_DUAL_CONTROL
  row.bucket = pending ? row.bucket : 'closed'
  audit(user.displayName, 'DISPUTE.DECIDED', row.number, `${str(body.decision)} · ${str(body.policyReference)}`, 'warning')
  return ok({ status: pending ? 'pending_approval' : 'executed' }, pending ? 'Decision recorded — refund needs a second approver.' : 'Decision issued. Both parties notified.')
})

/* Reports */
on('GET', '/admin/reports', ({ query }) => {
  requirePermission('reports.view')
  const tab = str(query.tab)
  const items = search(db.admin.reports.filter((r) => !tab || tab === 'all' || r.type === tab), query.search, (r) => `${r.title} ${r.target}`)
  const count = (t: string) => db.admin.reports.filter((r) => r.type === t).length
  return paginate(items, query, { counts: { all: db.admin.reports.length, listing: count('listing'), user: count('user'), message: count('message'), review: count('review') } })
})
on('POST', '/admin/reports/:id/actions', ({ params, body }) => {
  const user = requirePermission('reports.manage')
  const row = db.admin.reports.find((r) => r.id === params.id)
  if (!row) throw notFound('Report')
  audit(user.displayName, `REPORT.${str(body.action).toUpperCase()}`, row.target, row.title, 'warning')
  db.admin.reports = db.admin.reports.filter((r) => r.id !== row.id)
  return ok(row, 'Action applied and report closed.')
})

/* Payouts */
on('GET', '/admin/payouts', ({ query }) => {
  requirePermission('payouts.view')
  const tab = str(query.tab) || 'awaiting_approval'
  return paginate(db.admin.payouts.filter((p) => p.status === tab), query, { counts: { awaiting_approval: db.admin.payouts.filter((p) => p.status === 'awaiting_approval').length, processing: 64, failed: 2 } })
})
on('GET', '/admin/payouts/stats', () => {
  requirePermission('payouts.view')
  return ok(payoutStats)
})
on('POST', '/admin/payouts/approve', ({ body }) => {
  const user = requirePermission('payouts.approve')
  const ids = (body.ids as string[]) ?? []
  const rows = db.admin.payouts.filter((p) => ids.includes(p.id))
  if (rows.some((p) => p.flagged)) throw fail(409, 'CONFLICT', 'Flagged payouts must be reviewed individually.')
  const needsSecond = rows.filter((p) => p.amount.amount > PAYOUT_DUAL_CONTROL)
  for (const p of rows) if (p.amount.amount <= PAYOUT_DUAL_CONTROL) p.status = 'processing'
  audit(user.displayName, 'PAYOUT.APPROVED', `${rows.length} payouts`, needsSecond.length ? `${needsSecond.length} over $2,000 await 2nd approver` : 'Sent to PSP batch', 'success')
  return ok({ status: needsSecond.length ? 'pending_approval' : 'executed', approver: needsSecond.length ? 'Finance' : null }, needsSecond.length ? `${rows.length - needsSecond.length} approved · ${needsSecond.length} need a second approver.` : `${rows.length} payouts approved.`)
})
for (const action of ['hold', 'reject'] as const) {
  on('POST', `/admin/payouts/:id/${action}`, ({ params, body }) => {
    const user = requirePermission('payouts.approve')
    const row = db.admin.payouts.find((p) => p.id === params.id)
    if (!row) throw notFound('Payout')
    if (action === 'reject') row.status = 'failed'
    audit(user.displayName, `PAYOUT.${action.toUpperCase()}`, row.sellerName, str(body.reason) || action, 'warning')
    return ok(row)
  })
}
on('POST', '/admin/payouts/batches', () => {
  requirePermission('payouts.approve')
  return created({ batchId: id('batch') }, 'Batch started.')
})

/* Fees */
on('GET', '/admin/fees', () => {
  requirePermission('fees.view')
  return ok(db.admin.fees)
})
const saveRule = ({ params, body }: { params: Record<string, string>; body: Record<string, unknown> }) => {
  const user = requirePermission('fees.manage')
  if (num(body.rate) <= 0 || num(body.rate) > 30) throw validation({ rate: 'Rate must be between 0 and 30%.' })
  audit(user.displayName, params.id ? 'FEE_RULE.UPDATED' : 'FEE_RULE.CREATED', params.id ?? 'new', `${str(body.name)} ${num(body.rate)}% · awaiting approver`, 'warning')
  return ok({ status: 'pending_approval', approver: 'Super admin' }, 'Fee change submitted — a second approver must confirm.')
}
on('POST', '/admin/commission-rules', saveRule)
on('PATCH', '/admin/commission-rules/:id', saveRule)
on('PUT', '/admin/escrow-timings', () => {
  const user = requirePermission('fees.manage')
  audit(user.displayName, 'ESCROW_TIMINGS.UPDATED', 'platform', 'Awaiting approver', 'warning')
  return ok({ status: 'pending_approval', approver: 'Super admin' }, 'Submitted for approval.')
})

/* Promotions */
on('GET', '/admin/campaigns', () => {
  requirePermission('promotions.manage')
  return ok(db.admin.campaigns)
})
on('GET', '/admin/promo-codes', () => {
  requirePermission('promotions.manage')
  return ok(db.admin.promoCodes)
})
on('POST', '/admin/promo-codes', ({ body }) => {
  requirePermission('promotions.manage')
  if (!/^[A-Z0-9]{4,16}$/.test(str(body.code))) throw validation({ code: 'Use 4–16 uppercase letters or digits.' })
  const code = { id: id('pc'), code: str(body.code), discount: str(body.discount), uses: '0 / ∞', expires: str(body.expires) || '—', status: 'scheduled' as const }
  db.admin.promoCodes.unshift(code)
  return created(code)
})
on('POST', '/admin/campaigns/:id/duplicate', ({ params }) => {
  requirePermission('promotions.manage')
  const c = db.admin.campaigns.find((x) => x.id === params.id)
  if (!c) throw notFound('Campaign')
  const copy = { ...c, id: id('cmp'), name: `${c.name} (copy)`, status: 'scheduled' as const, performance: '—' }
  db.admin.campaigns.push(copy)
  return created(copy)
})

/* Broadcasts */
on('POST', '/admin/broadcasts/reach', ({ body }) => {
  requirePermission('broadcasts.manage')
  const n = ((body.audience as string[]) ?? []).length
  return ok({ reach: Math.max(120, 12418 - n * 2250), optedOut: 212 })
})
on('POST', '/admin/broadcasts', ({ body }) => {
  const user = requirePermission('broadcasts.manage')
  const errors: Record<string, string> = {}
  if (!((body.channels as string[]) ?? []).length) errors.channels = 'Choose at least one channel.'
  if (!str(body.pushTitle)) errors.push_title = 'Add a title.'
  if (str(body.pushTitle).length > 50) errors.push_title = 'Keep titles to 50 characters.'
  if (Object.keys(errors).length) throw validation(errors)
  audit(user.displayName, 'BROADCAST.SCHEDULED', str(body.pushTitle), str(body.sendAt), 'info')
  return created({ ...body, id: id('bc') }, 'Broadcast scheduled.')
})
on('POST', '/admin/broadcasts/test', () => {
  requirePermission('broadcasts.manage')
  return ok(null, 'Test sent to your device and inbox.')
})

/* Content */
on('GET', '/admin/content/hero-slides', () => {
  requirePermission('content.manage')
  return ok(db.admin.heroSlides)
})
on('PATCH', '/admin/content/hero-slides/:id', ({ params, body }) => {
  requirePermission('content.manage')
  const slide = db.admin.heroSlides.find((s) => s.id === params.id)
  if (!slide) throw notFound('Slide')
  if (str(body.headline).length > 60) throw validation({ headline: 'Headlines are limited to 60 characters.' })
  if (body.link && !str(body.link).startsWith('/')) throw validation({ link: 'Links must be in-app paths starting with /.' })
  Object.assign(slide, body)
  return ok(slide, 'Slide saved as draft.')
})
on('PUT', '/admin/content/hero-slides/order', ({ body }) => {
  requirePermission('content.manage')
  const ids = (body.ids as string[]) ?? []
  db.admin.heroSlides.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)).forEach((s, i) => (s.position = i + 1))
  return ok(db.admin.heroSlides)
})
on('POST', '/admin/content/publish', () => {
  const user = requirePermission('content.manage')
  audit(user.displayName, 'CONTENT.PUBLISHED', 'Home hero', `${db.admin.heroSlides.length} slides`, 'success')
  return ok(null, 'Changes published.')
})

/* Catalogue */
on('GET', '/admin/catalogue', () => {
  requirePermission('catalogue.manage')
  return ok(catalogue)
})
on('GET', '/admin/catalogue/:id', ({ params }) => {
  requirePermission('catalogue.manage')
  return ok({ attributes: categoryAttributes, sizeChart: params.id === 'cat_uniform_shirts' ? sizeChart : null, path: ['Catalogue', 'Apparel', 'Uniform shirts'] })
})

/* Analytics */
on('GET', '/admin/analytics', () => {
  requirePermission('analytics.view')
  return ok(analytics)
})

/* Team & roles */
on('GET', '/admin/roles', () => {
  requirePermission('team.view')
  return ok(db.admin.roles)
})
on('PATCH', '/admin/roles/:id', ({ params, body }) => {
  const user = requirePermission('roles.manage')
  const role = db.admin.roles.find((r) => r.id === params.id)
  if (!role) throw notFound('Role')
  if (role.id === 'role_super') throw fail(409, 'CONFLICT', 'Super admin permissions cannot be edited.')
  Object.assign(role, body)
  audit(user.displayName, 'ROLE.UPDATED', role.name, 'Permission matrix changed', 'warning')
  return ok(role)
})
on('POST', '/admin/roles', ({ body }) => {
  const user = requirePermission('roles.manage')
  if (!str(body.name)) throw validation({ name: 'Name the role.' })
  const role = { id: id('role'), name: str(body.name), members: 0, matrix: (body.matrix as never) ?? db.admin.roles[3]!.matrix }
  db.admin.roles.push(role)
  audit(user.displayName, 'ROLE.CREATED', role.name, '', 'warning')
  return created(role)
})
on('GET', '/admin/team', () => {
  requirePermission('team.view')
  return ok(db.admin.members)
})
on('POST', '/admin/team/invitations', ({ body }) => {
  const user = requirePermission('users.create')
  if (!str(body.email).endsWith('@pilotwardrobe.com')) throw validation({ email: 'Staff must use a @pilotwardrobe.com Google Workspace address.' })
  const role = db.admin.roles.find((r) => r.id === body.roleId)
  if (!role) throw validation({ role_id: 'Choose a role.' })
  const member = { id: id('stf'), name: str(body.name), initials: str(body.name).split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(), email: str(body.email), roleName: role.name, twoFactor: '—', lastActive: 'Invite sent today', status: 'invited' as const }
  db.admin.members.push(member)
  audit(user.displayName, 'STAFF.INVITED', member.email, role.name, 'info')
  return created(member, 'Invitation sent.')
})
on('PATCH', '/admin/team/:id', ({ params, body }) => {
  const user = requirePermission('roles.manage')
  const member = db.admin.members.find((m) => m.id === params.id)
  if (!member) throw notFound('Member')
  if (member.email.startsWith('tolu') && body.status === 'suspended') throw fail(409, 'CONFLICT', "You can't suspend yourself.")
  if (body.status) member.status = body.status as never
  if (body.roleId) member.roleName = db.admin.roles.find((r) => r.id === body.roleId)?.name ?? member.roleName
  audit(user.displayName, 'STAFF.UPDATED', member.email, JSON.stringify(body), 'warning')
  return ok(member)
})

/* Audit */
on('GET', '/admin/audit-logs', ({ query }) => {
  requirePermission('audit.view')
  let items = db.admin.audit
  if (query.actor) items = items.filter((a) => a.actor.name === query.actor)
  if (query.action) items = items.filter((a) => a.action.startsWith(str(query.action)))
  return paginate(items, query, {}, 25)
})

/* Settings */
on('GET', '/admin/settings', () => {
  requirePermission('settings.manage')
  return ok(db.admin.settings)
})
on('PATCH', '/admin/settings', ({ body }) => {
  const user = requirePermission('settings.manage')
  const sensitive = 'markets' in body || 'gateways' in body || 'fxMarginPercent' in body || 'settlementCurrency' in body
  // The mock applies immediately so the UI reflects it; the real API holds sensitive changes for a second approver.
  Object.assign(db.admin.settings, body)
  audit(user.displayName, 'SETTINGS.UPDATED', Object.keys(body).join(', '), sensitive ? 'Awaiting second approver' : 'Applied', 'warning')
  return ok({ status: sensitive ? 'pending_approval' : 'executed', approver: sensitive ? 'Super admin' : null }, sensitive ? 'Change submitted — a second approver must confirm.' : 'Saved.')
})
on('POST', '/admin/maintenance-windows', ({ body }) => {
  const user = requirePermission('settings.manage')
  if (!str(body.startsAt) || !str(body.endsAt)) throw validation({ starts_at: 'Choose a start and end time.' })
  db.admin.settings.maintenance = { scheduled: true, window: `${str(body.startsAt)} → ${str(body.endsAt)}` }
  audit(user.displayName, 'MAINTENANCE.SCHEDULED', 'platform', `${str(body.startsAt)} → ${str(body.endsAt)}`, 'warning')
  return ok({ status: 'pending_approval', approver: 'Super admin' }, 'Maintenance window submitted for approval.')
})
