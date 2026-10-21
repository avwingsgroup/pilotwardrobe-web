"""Builds the endpoint reference tables in docs/backend-api-contract.md from src/mocks/handlers.

The mock handlers are the executable contract, so the table (method, path, guard, success
status, error codes) is extracted from them; purposes, side effects and e-mails come from
the PURPOSE map below. Prose sections live in docs/backend-api-contract.md between the
<!-- endpoints:start --> / <!-- endpoints:end --> markers and are left untouched.

Usage: python scripts/generate-api-contract.py
"""
import glob
import os
import re

HANDLERS = 'src/mocks/handlers/*.ts'
DOC = 'docs/backend-api-contract.md'


def extract():
    rows = []
    for f in sorted(glob.glob(HANDLERS)):
        src = open(f, encoding='utf-8').read()
        helpers = {m.group(1): m.group(2) for m in re.finditer(r"\n(?:const|function) (\w+)\s*(?:=|\()([\s\S]*?)\n\}", src)}
        loops = {}
        for m in re.finditer(r"for \(const (?:\[?(\w+)[^\]]*\]?|(\w+)) of (\[[\s\S]*?\]) as const\) \{\n  on\('(\w+)', `([^`]+)`", src):
            var = m.group(1) or m.group(2)
            values = re.findall(r"\[?'([\w-]+)'", m.group(3))
            # tuple loops: first element of each tuple is the action
            if re.match(r"\[\s*\[", m.group(3)):
                values = [t[0] for t in re.findall(r"\['([\w-]+)'(?:, '([\w.-]+)')*", m.group(3))]
            loops[m.start()] = (m.group(4), m.group(5), var, values)
        parts = re.split(r"\n\s*on\(", src)
        for p in parts[1:]:
            m = re.match(r"'(\w+)', (?:'([^']+)'|`([^`]+)`),?\s*(\w+)?", p)
            if not m:
                continue
            method, path, tpath, ref = m.group(1), m.group(2), m.group(3), m.group(4)
            end = p.find('\n})')
            body = p[:end] if end > 0 else p
            if ref and ref in helpers:
                body += helpers[ref]
            for h in re.findall(r"(\w+)\(", body):
                if h in helpers and h not in ('ok', 'fail'):
                    body += helpers[h]
            paths = [path] if path else []
            if tpath:
                var = re.search(r"\$\{(\w+)\}", tpath).group(1)
                for (_, lp, lvar, values) in loops.values():
                    if lp == tpath:
                        paths = [tpath.replace('${' + var + '}', v) for v in values]
            perm = re.findall(r"requirePermission\((?:'([\w.]+)'|(\w+)|body\.action === 'approve' \? '([\w.]+)' : '([\w.]+)')\)", body)
            perms = []
            for a, b, c, d in perm:
                perms += [x for x in (a, c, d) if x] or ([f'`{b}`'] if b else [])
            if perms:
                guard = 'perm: ' + ', '.join(dict.fromkeys(perms))
            elif 'requireUser' in body:
                guard = 'auth'
            elif 'currentUser' in body:
                guard = 'optional'
            else:
                guard = 'public'
            status = '201' if 'created(' in body else ('204' if 'noContent' in body else '200')
            errs = set(f'{a} {b}' for a, b in re.findall(r"fail\((\d+), '(\w+)'", body))
            if 'validation(' in body:
                errs.add('422 VALIDATION_ERROR')
            if 'notFound(' in body:
                errs.add('404 NOT_FOUND')
            for pth in paths:
                if pth.startswith('/__mock'):
                    continue
                rows.append(dict(method=method, path=pth, guard=guard, status=status, errors=sorted(errs)))
    return rows


# Loop-registered routes carry the guard of their tuple element; pin them explicitly.
GUARD_OVERRIDES = {
    'POST /admin/users/:id/suspend': 'perm: users.suspend',
    'POST /admin/users/:id/reinstate': 'perm: users.suspend',
    'POST /admin/users/:id/restrict': 'perm: users.update',
    'POST /offers/:id/accept': 'auth (listing seller)',
    'POST /offers/:id/decline': 'auth (listing seller)',
    'POST /offers/:id/counter': 'auth (listing seller)',
    'POST /offers/:id/cancel': 'auth (offer buyer)',
    'POST /swap-requests/:id/accept': 'auth (counterparty)',
    'POST /swap-requests/:id/reject': 'auth (counterparty)',
    'POST /swap-requests/:id/cancel': 'auth (proposer)',
    'POST /listings/:id/reserve': 'auth (listing seller)',
    'POST /auth/logout': 'auth',
    'GET /me/kyc': 'auth',
    'POST /admin/auth/google': 'public (staff domain only)',
    'POST /admin/auth/webauthn': 'challenge',
    'POST /auth/two-factor/sms': 'challenge',
    'POST /auth/two-factor': 'challenge',
}

# purpose | side effects / e-mails (ZeptoMail template keys)
PURPOSE = {
    # Authentication
    'POST /auth/email-lookup': ('Email-first step (VA1): does an account exist and which sign-in methods it has.', 'Rate-limit 10/min/IP. Never reveal methods for unknown emails.'),
    'POST /auth/login': ('Password sign-in; may return a 2FA challenge.', 'Lock 15 min after 5 failures (423). E-mail `security.new_device` on first login from a new device.'),
    'POST /auth/two-factor': ('Complete sign-in with TOTP / SMS / backup code.', '`trust_device` sets a 30-day device cookie.'),
    'POST /auth/two-factor/sms': ('Send the SMS fallback code for a pending challenge.', 'Throttle 1/30 s.'),
    'POST /auth/register': ('Create a user or aviator account (VA4).', 'E-mail `auth.verify_email` (4-digit OTP, 10 min).'),
    'POST /auth/email/verify': ('Verify the email OTP (VA5).', 'E-mail `auth.welcome`.'),
    'POST /auth/email/resend': ('Resend the email OTP.', 'Throttle 1/60 s; e-mail `auth.verify_email`.'),
    'POST /auth/password/forgot': ('Request a password-reset link (VA9).', 'Always 200. E-mail `auth.password_reset` (link valid 60 min) if the account exists.'),
    'GET /auth/password/reset/:token': ('Check a reset token before showing the form (VA10).', ''),
    'POST /auth/password/reset': ('Set a new password with a reset token.', 'Optionally revoke other sessions. E-mail `security.password_changed`.'),
    'GET /auth/me': ('Session principal: user, role, effective permissions, counters.', 'Source of truth for every frontend guard.'),
    'POST /auth/logout': ('End the session / revoke the token.', ''),
    'GET /auth/username-availability': ('Live username check for social finish-setup (VA3).', ''),
    'GET /auth/social/:provider/redirect': ('Provider authorisation URL (Google / Apple / Facebook).', 'Backend owns client secrets and `state`.'),
    'POST /auth/social/:provider/callback': ('Exchange the provider `code` + `state`; returns new_account / link_required / authenticated.', ''),
    'POST /auth/social/complete': ('Finish a new social account (VA3).', 'E-mail `auth.welcome`.'),
    'POST /auth/social/link': ('Link a social identity to an existing password account (VA8).', 'E-mail `security.provider_linked`.'),
    'POST /admin/auth/google': ('Staff step 1: Google Workspace SSO (company domain only).', 'Returns a WebAuthn challenge.'),
    'POST /admin/auth/webauthn': ('Staff step 2: verify the security-key assertion; starts a staff session.', 'Audit `STAFF.SIGNED_IN`.'),
    # Users
    'PATCH /me': ('Update profile fields (name, username, phone, country, currency, locale, bio, avatar media id).', ''),
    'GET /me/security': ('Sign-in methods, 2FA state, active sessions (VB15 Security).', ''),
    'PUT /me/password': ('Change password (requires current password).', 'E-mail `security.password_changed`.'),
    'DELETE /me/sessions/:id': ('Sign out one device.', '409 when targeting the current session.'),
    'POST /me/sessions/logout-others': ('Sign out all other devices.', 'E-mail `security.sessions_revoked`.'),
    'DELETE /me/social/:provider': ('Unlink a social provider.', '409 if it is the last sign-in method.'),
    'POST /me/deactivate': ('Temporarily deactivate the account (listings hidden).', 'E-mail `account.deactivated`.'),
    'DELETE /me': ('Permanently delete the account.', '409 while orders/escrow/payouts are open. E-mail `account.deleted`.'),
    'GET /me/notification-preferences': ('Email/push preference matrix.', ''),
    'PUT /me/notification-preferences': ('Save preferences.', 'Transactional e-mails (orders, security) cannot be disabled.'),
    'GET /me/reviews': ('Reviews received and given (VB13).', ''),
    'GET /me/fit-kit': ('Fit Kit size profiles (VB16).', ''),
    'POST /me/fit-kit': ('Create a size profile.', ''),
    'PATCH /me/fit-kit/:id': ('Update a size profile / set default.', 'Re-computes `fit_match` on listings.'),
    'DELETE /me/fit-kit/:id': ('Delete a size profile.', ''),
    'GET /me/addresses': ('Saved delivery addresses.', ''),
    'POST /me/addresses': ('Add an address.', ''),
    'PATCH /me/addresses/:id': ('Edit / set default.', ''),
    'DELETE /me/addresses/:id': ('Delete an address.', ''),
    # Verification
    'GET /me/kyc': ('Current KYC flow state and step (VB2).', 'Polled during the liveness step.'),
    'POST /me/kyc/personal': ('KYC step 1: legal name, DOB, nationality.', ''),
    'POST /me/kyc/document': ('KYC step 2: document type + private media ids.', ''),
    'POST /me/kyc/submit': ('Submit for review after liveness (provider SDK/hand-off).', 'Status → pending. E-mail `kyc.submitted`; later `kyc.approved` / `kyc.rejected`.'),
    'GET /me/aviator': ('Aviator credentials status.', ''),
    'POST /me/aviator': ('Apply for aviator verification (licence details + private licence media).', 'Requires KYC approved. E-mail `aviator.submitted`.'),
    'GET /me/hangar': ('Seller dashboard aggregate (V5).', ''),
    # Marketplace
    'GET /home': ('Home feed: hero slides, categories, curated rails, gallery (V1).', 'Cache 60 s at the edge.'),
    'GET /listings': ('Search / browse with filters, sort, facets (V2).', 'Viewer-specific fields (`is_favorite`, `fit_match`) when signed in.'),
    'GET /listings/:slug': ('Listing detail (V3).', 'Increments view counter (deduplicated).'),
    'GET /listings/:slug/related': ('Related listings rail.', ''),
    'GET /categories': ('Category tree with counts.', ''),
    'GET /categories/:slug': ('Category with children, attributes and size chart.', ''),
    'GET /boost-packages': ('Promotion packages for listing boosts.', ''),
    'GET /me/favorites': ('Saved listings.', ''),
    'POST /listings/:id/favorite': ('Save a listing.', 'Enables `price_drop` notifications.'),
    'DELETE /listings/:id/favorite': ('Unsave a listing.', ''),
    'GET /sellers': ('Directory (photographers, official stores, aviators).', ''),
    'GET /sellers/:username': ('Public seller / photographer profile (V7, VB19).', ''),
    'GET /sellers/:username/listings': ('Seller storefront listings (paginated).', ''),
    'GET /sellers/:username/reviews': ('Seller reviews (paginated).', ''),
    'POST /sellers/:username/follow': ('Follow a seller.', 'Notify seller (in-app).'),
    'DELETE /sellers/:username/follow': ('Unfollow.', ''),
    'GET /pages/:slug': ('CMS content page (about, terms, privacy, how-it-works…). `body_html` must be server-sanitised.', ''),
    'POST /contact': ('Contact form (VC11): `topic`, `subject`, `message`, optional `order_id`, `phone` (required for `callback`), `attachment_ids` (≤ 5, uploaded via /media `type=message`).', 'E-mail `support.ticket_received` to sender; `trust_safety` pages the on-call T&S queue; `callback` queues a phone callback.'),
    'GET /help/summary': ('Help Center (VC10) panels: popular questions (with view counts) and per-component system status for the last 30 days.', 'Cache 5 min. Status must reflect real monitoring, never a hardcoded value.'),
    'GET /support/contact-info': ('Contact page (VC11) panels: chats per hour (WAT), average reply time, office addresses.', 'Cache 1 h.'),
    'POST /newsletter': ('Newsletter opt-in.', 'Double opt-in e-mail `marketing.confirm_subscription`.'),
    # Listings (seller)
    'GET /me/listings': ('Seller listings table with status tabs (VB3).', ''),
    'GET /me/listings/:id': ('Editable listing draft for the wizard.', ''),
    'POST /listings': ('Create a draft listing (V6 step 1).', ''),
    'PATCH /listings/:id': ('Autosave draft / edit live listing.', 'Edits to live listings may re-enter moderation.'),
    'POST /listings/:id/publish': ('Validate and publish.', '3-live-listing cap without KYC. E-mail `listing.published` or `listing.in_review`.'),
    'POST /listings/:id/pause': ('Pause (active → paused).', ''),
    'POST /listings/:id/resume': ('Resume (paused → active).', ''),
    'POST /listings/:id/archive': ('Archive.', ''),
    'POST /listings/:id/mark-sold': ('Mark sold off-platform.', ''),
    'POST /listings/:id/mark-unavailable': ('Temporarily unavailable.', ''),
    'POST /listings/:id/relist': ('Relist a sold/archived item.', ''),
    'POST /listings/:id/resubmit': ('Resubmit after moderation requested changes.', ''),
    'POST /listings/:id/promote': ('Apply a boost (payment handled via boost order).', ''),
    'DELETE /listings/:id': ('Delete a draft / archived listing.', '409 for listings with orders.'),
    'POST /listings/bulk': ('Bulk pause / resume / archive / price change.', ''),
    'POST /listings/imports': ('CSV import (multipart `file`).', 'Returns created count + failed rows.'),
    'POST /listings/price-check': ('Suggested price range from comparable sales.', ''),
    'POST /listings/fee-quote': ('Commission + net payout for a price.', ''),
    'POST /listings/:id/reserve': ('Seller marks a listing reserved for a buyer (from Messages).', 'Seller only; listing must be active.'),
    'POST /media': ('Upload one image/file (multipart `file`, `type`). Laravel streams to Cloudinary and returns a MediaAsset.', 'Max 15 MB; JPEG/PNG/WebP/HEIC (PDF for kyc/evidence). `kyc`, `dispute_evidence` → private assets.'),
    'DELETE /media/:id': ('Delete an unattached upload.', 'Destroys the Cloudinary asset server-side.'),
    # Offers / swaps
    'POST /listings/:id/offers': ('Make an offer.', 'Notify + e-mail seller `offer.received`.'),
    'GET /me/offers': ('Offers inbox (`box=received|sent`).', ''),
    'POST /offers/:id/accept': ('Accept an offer.', 'Listing reserved; e-mail buyer `offer.accepted` with checkout link.'),
    'POST /offers/:id/decline': ('Decline.', 'E-mail buyer `offer.declined`.'),
    'POST /offers/:id/counter': ('Counter-offer.', 'E-mail buyer `offer.countered`.'),
    'POST /offers/:id/cancel': ('Buyer withdraws an offer.', ''),
    'POST /listings/:id/swap-requests': ('Propose a swap (V8).', 'Requires KYC. E-mail counterparty `swap.proposed`.'),
    'GET /me/swap-requests': ('Swap inbox.', ''),
    'POST /swap-requests/:id/accept': ('Accept a swap.', 'Reserves listings; creates linked orders; e-mail `swap.accepted`.'),
    'POST /swap-requests/:id/reject': ('Reject.', 'E-mail `swap.rejected`.'),
    'POST /swap-requests/:id/cancel': ('Proposer withdraws.', ''),
    # Orders
    'GET /cart': ('Cart with availability re-checked.', ''),
    'POST /cart/items': ('Add a listing (with size).', '409 if unavailable / own listing.'),
    'DELETE /cart/items/:id': ('Remove from cart.', ''),
    'POST /checkout/quote': ('Price breakdown: items, shipping options, fees, promo, totals.', 'No side effects.'),
    'GET /me/orders': ('Orders (`role=buying|selling`, status tabs).', ''),
    'GET /orders/:id': ('Order detail with escrow, timeline, `allowed_actions`.', 'Buyer, seller or staff only.'),
    'POST /orders': ('Create an order in pending_payment (re-quoted server-side).', 'Reserves stock 15 min.'),
    'POST /orders/:id/cancel': ('Cancel before dispatch.', 'Refund if paid; e-mail both parties `order.cancelled`.'),
    'POST /orders/:id/confirm-delivery': ('Buyer confirms landed (optionally with review).', 'Escrow released; e-mail seller `order.completed`, `payout.available`.'),
    'POST /orders/:id/dispatch': ('Seller adds carrier + tracking.', 'E-mail buyer `order.dispatched`.'),
    'POST /orders/:id/reviews': ('Leave a review.', 'E-mail counterparty `review.received`.'),
    'GET /orders/:id/invoice': ('PDF invoice.', ''),
    'POST /orders/:order/downloads/:asset/authorize': ('Short-lived signed URL for a purchased digital asset.', 'Paid orders only; log download.'),
    # Payments
    'GET /payment-methods': ('Gateways available for currency/country.', ''),
    'POST /payments/initialize': ('Create a gateway transaction; returns `authorization_url` + `reference`.', 'Idempotent per order + gateway while pending.'),
    'GET /payments/:reference': ('Verified payment status (polled after redirect).', 'Verifies with the gateway if the webhook has not arrived.'),
    'POST /webhooks/:gateway': ('Gateway → Laravel webhook. **Not called by the SPA.**', 'Verify signature; idempotent; on success order → paid, escrow → held; e-mail buyer `order.paid` + seller `order.new_sale`.'),
    # Wallet
    'GET /me/wallet': ('Balances: available, in escrow, pending, lifetime.', ''),
    'GET /me/wallet/transactions': ('Ledger (paginated, filter by type).', ''),
    'GET /me/payout-methods': ('Saved payout methods (masked).', ''),
    'POST /me/payout-methods': ('Add bank / mobile money / PayPal payout method.', 'Verify via gateway; e-mail `security.payout_method_added`.'),
    'GET /me/payout-schedule': ('Automatic payout schedule.', ''),
    'PUT /me/payout-schedule': ('Update schedule.', ''),
    'POST /me/withdrawals/quote': ('Fee, net and ETA for a withdrawal.', ''),
    'POST /me/withdrawals': ('Request a withdrawal (2FA code when enabled).', '> $2,000 needs staff approval. E-mail `payout.requested`, later `payout.sent`.'),
    'POST /me/wallet/statements': ('Signed URL for a monthly statement PDF.', ''),
    # Messages
    'GET /conversations': ('Conversation list (`context=buying|selling`).', ''),
    'GET /conversations/:id': ('Conversation header (participant, listing, offer context).', ''),
    'GET /conversations/:id/messages': ('Messages (cursor/paginated).', ''),
    'POST /conversations/:id/messages': ('Send a message.', 'Flags off-platform payment patterns. E-mail digest `message.received` if recipient offline.'),
    'POST /conversations': ('Start / fetch a conversation about a listing.', ''),
    'POST /conversations/:id/read': ('Mark read.', ''),
    'POST /conversations/:id/report': ('Report a conversation.', 'Creates an AD10 report.'),
    'GET /notifications': ('Notification centre (category filter).', ''),
    'GET /notifications/unread-count': ('Badge counts.', 'Polled every 60 s.'),
    'PATCH /notifications/:id/read': ('Mark one read.', ''),
    'POST /notifications/read-all': ('Mark all read.', ''),
    # Disputes
    'GET /me/disputes': ('My disputes.', ''),
    'GET /disputes/:id': ('Case view with timeline, messages, evidence (VB9).', 'Parties and staff only.'),
    'POST /disputes': ('Open a dispute (VB8).', 'Freezes escrow; e-mail seller `dispute.opened`, buyer `dispute.received`.'),
    'POST /disputes/:id/messages': ('Add a statement / evidence.', 'E-mail counterparty `dispute.updated`.'),
    'POST /disputes/:id/withdraw': ('Buyer withdraws the dispute.', 'Unfreezes escrow.'),
    'POST /disputes/:id/proposal/accept': ("Accept the seller's settlement proposal.", 'Executes the refund split.'),
    'POST /disputes/:id/proposal/decline': ('Decline the proposal (escalates to staff).', ''),
    # Admin
    'GET /admin/overview': ('Control Tower KPIs, queues, alerts (AD2).', ''),
    'POST /admin/exports': ('Queue a CSV export of a table.', 'Audit `EXPORT.CREATED`; e-mail link when ready.'),
    'GET /admin/users': ('Users table (AD3).', ''),
    'POST /admin/users/invitations': ('Invite a user.', 'E-mail `auth.invitation`.'),
    'GET /admin/users/:id': ('User 360 (AD4).', ''),
    'PATCH /admin/users/:id/limits': ('Change selling/withdrawal limits.', 'Audit.'),
    'POST /admin/users/:id/notes': ('Internal note.', 'Audit.'),
    'POST /admin/users/:id/impersonate': ('Read-only impersonation session (15 min).', 'Audit; user sees it in security log.'),
    'POST /admin/users/:id/role': ('Change role.', 'Audit; super_admin cannot be assigned here.'),
    'POST /admin/users/:id/suspend': ('Suspend (reason required).', 'Audit; e-mail `account.suspended`.'),
    'POST /admin/users/:id/reinstate': ('Reinstate.', 'Audit; e-mail `account.reinstated`.'),
    'POST /admin/users/:id/restrict': ('Restrict selling/withdrawals.', 'Audit; e-mail `account.restricted`.'),
    'GET /admin/kyc': ('KYC queue (AD5).', ''),
    'GET /admin/kyc/:id': ('KYC case with signed document URLs and automated checks.', ''),
    'POST /admin/kyc/:id/approve': ('Approve.', 'Audit; e-mail `kyc.approved`.'),
    'POST /admin/kyc/:id/reject': ('Reject (reason).', 'Audit; e-mail `kyc.rejected`.'),
    'POST /admin/kyc/:id/escalate': ('Escalate to senior reviewer.', 'Audit.'),
    'POST /admin/kyc/:id/request-info': ('Ask the user for more documents.', 'E-mail `kyc.more_info`.'),
    'GET /admin/moderation': ('Listing moderation queue (AD6).', ''),
    'POST /admin/moderation/decisions': ('Approve / request changes / remove (bulk).', 'Audit; e-mail seller `listing.approved` / `listing.changes_requested` / `listing.removed`.'),
    'GET /admin/orders': ('Orders & escrow table (AD7).', ''),
    'GET /admin/orders/stats': ('Escrow buckets.', ''),
    'GET /admin/orders/:id': ('Order detail with ledger and PSP events (AD8).', ''),
    'POST /admin/orders/:id/refund': ('Full/partial refund.', '> $1,000 → pending_approval. Audit; e-mail buyer `order.refunded`.'),
    'POST /admin/orders/:id/release': ('Force-release escrow.', 'Audit.'),
    'POST /admin/orders/:id/hold': ('Put escrow on hold.', 'Audit.'),
    'POST /admin/orders/reconcile': ('Start PSP reconciliation job.', ''),
    'GET /admin/disputes': ('Disputes queue (AD9).', ''),
    'GET /admin/disputes/:id': ('Mediation workspace.', ''),
    'POST /admin/disputes/:id/messages': ('Mediator message (optionally internal).', 'E-mail parties `dispute.updated` unless internal.'),
    'POST /admin/disputes/:id/decision': ('Rule on a dispute.', 'Dual control above threshold; e-mail `dispute.resolved`.'),
    'GET /admin/reports': ('User reports queue (AD10).', ''),
    'POST /admin/reports/:id/actions': ('Dismiss / warn / remove / suspend.', 'Audit.'),
    'GET /admin/payouts': ('Payout queue (AD12).', ''),
    'GET /admin/payouts/stats': ('Payout totals.', ''),
    'POST /admin/payouts/approve': ('Approve selected payouts (second approver).', '409 if the requester approves their own.'),
    'POST /admin/payouts/batches': ('Create a payout batch for the PSP.', ''),
    'POST /admin/payouts/:id/hold': ('Hold a payout.', 'E-mail `payout.on_hold`.'),
    'POST /admin/payouts/:id/reject': ('Reject a payout (funds back to wallet).', 'E-mail `payout.rejected`.'),
    'GET /admin/fees': ('Commission rules, escrow timings (AD13).', ''),
    'POST /admin/commission-rules': ('Create a commission rule.', 'Dual control.'),
    'PATCH /admin/commission-rules/:id': ('Edit a commission rule.', 'Dual control.'),
    'PUT /admin/escrow-timings': ('Change auto-release / dispute windows.', 'Dual control.'),
    'GET /admin/campaigns': ('Promotions (AD14).', ''),
    'GET /admin/promo-codes': ('Promo codes.', ''),
    'POST /admin/promo-codes': ('Create a promo code.', 'Audit.'),
    'POST /admin/campaigns/:id/duplicate': ('Duplicate a campaign.', ''),
    'POST /admin/broadcasts/reach': ('Estimate audience reach.', ''),
    'POST /admin/broadcasts': ('Send / schedule a broadcast (email/push/in-app).', 'Marketing e-mails via ZeptoMail bulk; respects opt-outs.'),
    'POST /admin/broadcasts/test': ('Send a test to the author.', ''),
    'GET /admin/content/hero-slides': ('Home hero slides (AD15).', ''),
    'PATCH /admin/content/hero-slides/:id': ('Edit a slide (draft).', ''),
    'PUT /admin/content/hero-slides/order': ('Reorder slides.', ''),
    'POST /admin/content/publish': ('Publish content drafts.', 'Purge home cache.'),
    'GET /admin/catalogue': ('Category tree (AD16).', ''),
    'GET /admin/catalogue/:id': ('Category attributes and size chart.', ''),
    'GET /admin/analytics': ('Analytics dashboard (AD17).', ''),
    'GET /admin/roles': ('Staff roles and permission matrix (AD18).', ''),
    'PATCH /admin/roles/:id': ('Edit a role matrix.', '409 for super admin. Audit.'),
    'POST /admin/roles': ('Create a role.', 'Audit.'),
    'GET /admin/team': ('Staff members.', ''),
    'POST /admin/team/invitations': ('Invite staff.', 'E-mail `staff.invitation`.'),
    'PATCH /admin/team/:id': ('Change a member\'s role / deactivate.', '409 for the last super admin.'),
    'GET /admin/audit-logs': ('Immutable audit log (AD19).', ''),
    'GET /admin/settings': ('Platform settings (AD20).', ''),
    'PATCH /admin/settings': ('Change markets, gateways, feature flags.', 'Dual control for payment settings.'),
    'POST /admin/maintenance-windows': ('Schedule maintenance (serves 503 MAINTENANCE).', 'E-mail `system.maintenance_scheduled` to active users.'),
}

GROUPS = [
    ('Authentication', lambda p: p.startswith('/auth') or p.startswith('/admin/auth')),
    ('Account & profile (self)', lambda p: p in ('/me', '/me/security', '/me/password', '/me/sessions/logout-others', '/me/deactivate', '/me/notification-preferences') or p.startswith('/me/sessions') or p.startswith('/me/social') or p.startswith('/me/fit-kit') or p.startswith('/me/addresses')),
    ('Verification (KYC & aviator)', lambda p: p.startswith('/me/kyc') or p.startswith('/me/aviator')),
    ('Catalogue, content & support', lambda p: p in ('/home', '/listings', '/categories', '/boost-packages') or (p.startswith('/listings/:slug')) or p.startswith('/categories/') or p.startswith('/pages') or p in ('/contact', '/newsletter') or p.startswith('/help/') or p.startswith('/support/')),
    ('Favourites & profiles', lambda p: p.startswith('/sellers') and not p.endswith('/reviews') or p == '/me/favorites' or p.endswith('/favorite')),
    ('Listings (seller) & media', lambda p: p.startswith('/me/listings') or (p.startswith('/listings') and not p.endswith('/offers') and not p.endswith('/swap-requests')) or p.startswith('/media') or p == '/me/hangar'),
    ('Offers', lambda p: p.startswith('/offers') or p.endswith('/offers')),
    ('Swaps', lambda p: 'swap-requests' in p),
    ('Cart, checkout & orders', lambda p: p.startswith('/cart') or p.startswith('/checkout') or (p.startswith('/orders') and not p.endswith('/reviews')) or p == '/me/orders'),
    ('Payments', lambda p: p.startswith('/payment') or p.startswith('/webhooks')),
    ('Wallet & payouts', lambda p: p.startswith('/me/wallet') or p.startswith('/me/payout') or p.startswith('/me/withdrawals')),
    ('Reviews', lambda p: p.endswith('/reviews')),
    ('Messaging', lambda p: p.startswith('/conversations')),
    ('Notifications', lambda p: p.startswith('/notifications')),
    ('Disputes', lambda p: p.startswith('/disputes') or p == '/me/disputes'),
    ('Admin — overview, users & KYC', lambda p: p.startswith('/admin/overview') or p.startswith('/admin/exports') or p.startswith('/admin/users') or p.startswith('/admin/kyc')),
    ('Admin — moderation, orders, disputes & reports', lambda p: p.startswith('/admin/moderation') or p.startswith('/admin/orders') or p.startswith('/admin/disputes') or p.startswith('/admin/reports')),
    ('Admin — money (payouts, fees)', lambda p: p.startswith('/admin/payouts') or p.startswith('/admin/fees') or p.startswith('/admin/commission') or p.startswith('/admin/escrow')),
    ('Admin — growth & content', lambda p: p.startswith('/admin/campaigns') or p.startswith('/admin/promo') or p.startswith('/admin/broadcasts') or p.startswith('/admin/content') or p.startswith('/admin/catalogue') or p.startswith('/admin/analytics')),
    ('Admin — team, audit & settings', lambda p: p.startswith('/admin/roles') or p.startswith('/admin/team') or p.startswith('/admin/audit') or p.startswith('/admin/settings') or p.startswith('/admin/maintenance')),
]


def to_laravel(path):
    return re.sub(r':(\w+)', r'{\1}', path)


def main():
    rows = extract()
    rows.append(dict(method='POST', path='/webhooks/:gateway', guard='gateway signature', status='200', errors=['400 invalid signature']))
    # `/listings/:id/:action` is one handler driven by a TRANSITIONS table; list each action.
    commerce = open('src/mocks/handlers/commerce.handlers.ts', encoding='utf-8').read()
    table = re.search(r"const TRANSITIONS[^=]*= \{([\s\S]*?)\n\}", commerce).group(1)
    actions = re.findall(r"^\s*'?([\w-]+)'?: \{", table, re.M)
    generic = next(r for r in rows if r['path'] == '/listings/:id/:action')
    rows.remove(generic)
    rows += [dict(generic, path=f'/listings/:id/{a}') for a in actions]
    seen = set()
    unique = []
    for r in rows:
        k = f"{r['method']} {r['path']}"
        if k in seen:
            continue
        seen.add(k)
        r['guard'] = GUARD_OVERRIDES.get(k, r['guard'])
        unique.append(r)
    missing = [f"{r['method']} {r['path']}" for r in unique if f"{r['method']} {r['path']}" not in PURPOSE]
    out = [f'_{len(unique)} endpoints. Generated by `python scripts/generate-api-contract.py` from `src/mocks/handlers`; do not edit by hand._', '']
    out.append('Guard legend: **public** — no session · **optional** — works signed out, personalised when signed in · **auth** — any signed-in user (ownership rule in brackets) · **challenge** — requires a pending auth challenge id · **perm: x** — staff/user must hold permission `x` (see §Roles & permissions).')
    out.append('')
    placed = set()
    for title, test in GROUPS:
        group = [r for r in unique if test(r['path']) and f"{r['method']} {r['path']}" not in placed]
        if not group:
            continue
        out += [f'### {title}', '', '| Method | Path | Guard | OK | Errors | Purpose | Side effects · e-mails |', '|---|---|---|---|---|---|---|']
        for r in group:
            k = f"{r['method']} {r['path']}"
            placed.add(k)
            purpose, effects = PURPOSE.get(k, ('', ''))
            errs = '<br>'.join(e for e in r['errors']) or '—'
            out.append(f"| `{r['method']}` | `{to_laravel(r['path'])}` | {r['guard']} | {r['status']} | {errs} | {purpose} | {effects or '—'} |")
        out.append('')
    leftovers = [r for r in unique if f"{r['method']} {r['path']}" not in placed]
    assert not leftovers, leftovers
    if missing:
        print('WARNING: no purpose for', missing)
    doc = open(DOC, encoding='utf-8').read()
    start, end = '<!-- endpoints:start -->', '<!-- endpoints:end -->'
    a, b = doc.index(start) + len(start), doc.index(end)
    doc = doc[:a] + '\n' + '\n'.join(out) + '\n' + doc[b:]
    open(DOC, 'w', encoding='utf-8', newline='\n').write(doc)
    print(len(unique), 'endpoints written')


if __name__ == '__main__':
    os.chdir(os.path.join(os.path.dirname(__file__), '..'))
    main()
