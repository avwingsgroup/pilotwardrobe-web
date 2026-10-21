"""Generates docs/api-payloads/*.md from the wire-format samples captured by tests/unit/contract-payloads.spec.ts.

Usage: npm run docs:payloads
"""
import json
import sys
from pathlib import Path
from urllib.parse import urlencode

samples = json.load(open(sys.argv[1], encoding='utf-8'))
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)

WHO = {
    None: 'Visitor (no session)',
    'usr_10422': '`pilot@example.com` (user, KYC approved)',
    'usr_102': '`aviator@example.com` (aviator)',
    'usr_20001': '`admin@example.com` (admin, Trust & safety)',
    'usr_20000': '`super@example.com` (super_admin)',
    'usr_12409': '`newbie@example.com` (user, KYC not started)',
}

DOCS = {
    'auth': ('Authentication', """
Covers email-first sign-in (VA1/VA2), registration with email OTP (VA4–VA5), two-step verification (VA6), password reset (VA9–VA10), social sign-in (VA3/VA7/VA8) and the session principal.

- `GET /auth/me` is the frontend's single source of truth for the signed-in user, role and **effective permissions**. It is called on boot and after every auth transition.
- `POST /auth/login` returns either `status: "authenticated"` or `status: "two_factor_required"` with a `challenge_id`. Staff accounts never use this endpoint; they sign in via `/admin/auth/*` (Google Workspace + WebAuthn).
- In cookie mode (Sanctum SPA), the frontend calls `GET /sanctum/csrf-cookie` before the first state-changing request and sends `X-XSRF-TOKEN`. `access_token` in the login response is only used in token mode and may be omitted in cookie mode.
- Failed logins: after 5 consecutive failures return **423 `ACCOUNT_LOCKED`** with `meta.retry_after` (seconds). While 1–2 attempts remain, include `meta.attempts_remaining`.
- `POST /auth/password/forgot` always returns 200 with the same message, whether or not the email exists (no account enumeration).
- Email OTP is 4 digits, expires after 10 minutes (`verification.expires_in`), resend is throttled (`verification.resend_available_in`).
"""),
    'users': ('Users (self-service account)', """
Endpoints under `/me/*` act on the session user only. They never take a user id.

- Password change, session revocation, social unlinking and account deletion are security events: send a ZeptoMail security notice to the account email (see `docs/backend-api-contract.md` §Email notifications).
- `DELETE /me` and `DELETE /me/social/{provider}` return **409 `CONFLICT`** when the action would leave the account in an invalid state (open orders/escrow balance; last sign-in method).
- KYC documents are uploaded first through `POST /media` with `type=kyc`; KYC endpoints receive only media ids. KYC media must be stored as **private/authenticated** Cloudinary assets and never returned as public URLs to anyone but staff with `kyc.view`.
- `GET /me/hangar` is an aggregate for the seller dashboard (V5) to avoid N requests on page load.
"""),
    'profiles': ('Public profiles (sellers, photographers, directory)', """
Public, unauthenticated reads of seller storefronts (V7, VB19) and the directory. When a session is present, `is_following` reflects the viewer.

- Never include private fields (email, phone, exact address, KYC data) in public seller payloads.
- `rating_breakdown` keys are the strings `"1"`–`"5"`.
"""),
    'listings': ('Listings (seller side)', """
Create/edit/publish lifecycle for the listing wizard (V6) and *My listings* (VB3).

- A listing is created as `draft` and becomes `active` (or `pending_review` when moderation rules apply) through `POST /listings/{id}/publish`. Publish validates the full listing and returns 422 with field errors (e.g. `media_ids`).
- Unverified (KYC not approved) sellers are limited to **3 live listings**; the fourth publish returns **403 `KYC_REQUIRED`**.
- State actions use `POST /listings/{id}/{action}` with `action ∈ pause | resume | archive | mark-sold | mark-unavailable | relist | resubmit | promote` (allowed source states: pause←active, resume←paused, archive←active/paused, mark-sold←active/reserved/paused, relist←sold/archived, resubmit←needs_changes); illegal transitions return **409 `INVALID_STATE_TRANSITION`**.
- Photos are uploaded one at a time via `POST /media` (multipart `file` + `type=listing`). Laravel uploads to Cloudinary server-side and returns the `MediaAsset` (public id + transformation URLs). The browser never talks to the Cloudinary API.
- `POST /listings/fee-quote` returns the commission and net payout for a price so the wizard can display it; the backend is authoritative and re-computes at sale time.
"""),
    'products': ('Products (catalogue, listing detail, categories)', """
Public catalogue reads used by Home (V1), Marketplace (V2), Listing detail (V3) and Categories.

- `GET /listings` is server-side paginated, filtered and sorted. The frontend mirrors every query parameter in the URL, so these must be stable and bookmarkable. Supported query params: `search`, `category` (comma list of slugs; a parent slug includes its children), `condition` (comma list), `deal_type` (comma list of `buy_now,offers,swaps`), `min_price`/`max_price` (minor units), `verified_only`, `min_rating`, `free_delivery` (booleans as `true`), `format` (`physical | digital | print`), `seller` (username), `aircraft_type`, `promoted`, `sort` (`newest | recommended | price_asc | price_desc | popular | rating | nearest`), `page`, `per_page` (≤ 100).
- Paginated responses include `meta.facets` (`categories`, `conditions`, `deal_types`, … each `[{ value, label, count }]`) so the filter panel can show counts.
- `GET /listings/{slug}` returns `sizes.fit_match` computed against the viewer's Fit Kit when signed in.
- Every image is a `MediaAsset` (see `docs/frontend-backend-handoff.md` §Media).
"""),
    'offers': ('Offers', """
Price offers on a listing (VA14 → V3 offer modal, VB14 inbox).

- Amounts in requests are **integer minor units** plus a separate `currency` field. Responses use the `Money` object `{ amount, currency, formatted }`.
- The backend enforces the listing's `minimum_offer`: an offer below it is rejected with 422 on `amount` ("The seller doesn't accept offers below …").
- Accept/decline/counter are allowed only for the **seller** of the listing; cancel only for the **buyer** who made the offer. Return 403 otherwise, 409 `INVALID_STATE_TRANSITION` when the offer is no longer `pending`.
- A counter must be strictly between the current offer and the asking price.
- Offers expire after 24 h (`expires_at`); a scheduled job moves them to `expired` and notifies both parties.
- Accepting an offer moves the listing to `reserved` for that buyer; the buyer then checks out at the agreed price with `POST /orders` + `offer_id`. Each offer carries `allowed_actions` for the viewer, which the UI renders verbatim.
"""),
    'swaps': ('Swaps', """
Item-for-item trades with optional cash adjustment (V8 swap builder, VB14).

- Proposing a swap requires **KYC approved** (403 `KYC_REQUIRED`) and that every `offered_listing_ids` item belongs to the proposer and is `active`.
- `cash_adjustment.amount` is signed minor units: positive = proposer pays the counterparty, negative = proposer receives.
- `POST /swap-requests/{id}/{accept|reject|cancel}`. Accepting reserves all listings involved and creates a linked order pair in `pending_payment` (cash adjustment + both shipping legs are paid through escrow).
"""),
    'orders': ('Orders, cart & checkout', """
Cart (VB17), checkout (V4), order list/detail (VB4, VB6).

- `POST /checkout/quote` is a pure calculation (no side effects) and is called whenever address, shipping option or promo code changes. `POST /orders` **re-quotes server-side**; never trust totals sent by the client (the frontend does not send any).
- `POST /orders` creates the order in `pending_payment` and reserves the listing for a short window (15 min). Payment is a separate step (`/payments/initialize`).
- Order actions: `cancel` (buyer, before dispatch), `dispatch` (seller, requires `carrier` + `tracking_number`), `confirm-delivery` (buyer; releases escrow), `reviews` (after completion). Illegal transitions → 409 `INVALID_STATE_TRANSITION`.
- `GET /orders/{id}/invoice` streams a PDF (`application/pdf`).
- Digital/print downloads: `POST /orders/{order}/downloads/{asset}/authorize` returns a short-lived signed URL (`expires_at`) after checking that the order is paid and belongs to the viewer. Never put permanent download URLs in listing or order payloads.
"""),
    'payments': ('Payments', """
Gateway-agnostic payment flow. **The frontend never decides that a payment succeeded.**

1. `GET /payment-methods?currency=&country=` — which gateways to offer (Stripe, PayPal, Paystack, Flutterwave, Monnify), with display metadata only.
2. `POST /payments/initialize` — Laravel creates the payment with the gateway using its **secret key** and returns `authorization_url` + `reference`. The frontend redirects only if the host is on its allow-list (`checkout.stripe.com`, `*.paypal.com`, `checkout.paystack.com`, `checkout.flutterwave.com`, `*.monnify.com`).
3. The gateway redirects the buyer to `return_url` (`/payment/callback?reference=…`). Query parameters such as `status=success` are **ignored**.
4. The frontend polls `GET /payments/{reference}` (backoff: 1.5 s → 8 s, ~60 s budget). Laravel verifies with the gateway API and/or the signed webhook, then returns `status` (`pending | processing | successful | failed | cancelled`). On `successful` the order moves to `paid` and escrow to `held`.

Webhooks (`POST /webhooks/{gateway}`) are gateway → Laravel only, must verify signatures, must be idempotent on `reference`, and are not called by the frontend. Card numbers/CVV never touch Pilotwardrobe servers or the SPA: the gateway's hosted page collects them.
"""),
    'transactions': ('Wallet, transactions & payouts', """
Seller wallet (VB7), ledger, payout methods and withdrawals.

- Balances are derived from an append-only ledger; `available` excludes escrow and pending withdrawals.
- `POST /me/withdrawals/quote` returns fee + net + ETA; `POST /me/withdrawals` requires `two_factor_code` when the account has 2FA, and is rejected (422) if `amount` > `available`.
- Withdrawals above the platform threshold (default $2,000) are created as `pending` and require a staff approval in AD12 (dual control).
- Payout method creation stores only gateway recipient codes / masked account numbers; full bank details are verified via the gateway (Paystack/Flutterwave transfer recipients, Stripe Connect) and never echoed back unmasked.
"""),
    'messages': ('Messaging', """
Buyer↔seller conversations (VB10/VB11).

- `POST /conversations` opens (or returns the existing) thread for a listing between viewer and seller.
- Message `body` is **plain text**. The SPA renders it as text, never as HTML. Strip control characters server-side; reject > 4,000 chars.
- Attachments are uploaded first via `POST /media` (`type=message`) and referenced by `attachment_ids`.
- The backend should flag and optionally block off-platform payment solicitation (phone numbers, bank details, "pay outside") and return `flags` on the message; users can report a conversation (`POST /conversations/{id}/report`).
- Real-time delivery is out of scope for v1; the SPA polls the open conversation every 10 s and the unread count every 60 s. A Laravel Reverb/Pusher channel `private-user.{id}` can replace polling without changing payloads.
"""),
    'reviews': ('Reviews', """
- A review can be left once per completed order per side (`role: buyer | seller`). Duplicate → 409 `CONFLICT`.
- `rating` is an integer 1–5; `tags` are chosen from a fixed list and sent as their display labels: `As described`, `Fast dispatch`, `Well packed`, `Great communication`. Reject anything else.
- Reviews update the seller's `rating`, `total_reviews` and `rating_breakdown`.
"""),
    'notifications': ('Notifications', """
In-app notification centre (VB12). Each notification is also eligible for email (ZeptoMail) and push according to `/me/notification-preferences`.

- `category ∈ orders | offers_swaps | messages | account | disputes | payouts | reviews` drives the tabs/filters; `icon ∈ offer | order | landed | dispute | review | payout | verified | message` drives the glyph. `actions` are optional inline buttons (`{ label, to }`).
- `link` is an **internal path** (e.g. `/hangar/orders/ord_4471`). The SPA only follows relative paths; absolute URLs are ignored.
"""),
    'disputes': ('Disputes', """
Buyer protection flow (VB8 open dispute, VB9 case view; AD9 staff mediation).

- A dispute can be opened by the buyer on an order in `delivered` or within the protection window after `completed`; opening **freezes escrow** (`escrow.status: frozen`).
- `reason ∈ not_as_described | not_received | damaged | counterfeit`, `requested ∈ full_refund | partial_refund | return_and_refund | replacement`. `description` ≥ 20 chars. Evidence is uploaded via `POST /media` (`type=dispute_evidence`, private assets).
- The seller has 48 h to respond (`respond_by`) before the case auto-escalates to `under_review`.
- `POST /disputes/{id}/proposal/{accept|decline}` lets the buyer accept a seller's settlement proposal.
"""),
    'support': ('Support (Help Center, contact)', """
Help Center (VC10) and Contact us (VC11).

- `GET /help/summary` drives “Most read this week” and the system-status panel. Status must come from real monitoring (one entry per day for the window); the SPA shows whatever `overall` says, so never hardcode `operational`.
- `POST /contact` creates a support ticket. `topic ∈ order | escrow | dispute | selling | account | trust_safety | callback | other`. `phone` is required for `callback`; `order_id` must belong to the signed-in user; `attachment_ids` (≤ 5) are private media uploaded with `POST /media` (`type=message`). Visitors can contact support without an account.
- Guides and policies (VC1–VC9) are static content in the SPA (`src/content/info`); timings quoted there (5-day dispatch, 72-hour inspection, 48-hour seller reply, 5-business-day mediation, 8% commission) must match the backend’s escrow and fee settings.
"""),
    'admin': ('Admin (Control Tower)', """
All `/admin/*` endpoints require a staff session (`role ∈ admin | super_admin`) **and** the specific permission listed in `docs/backend-api-contract.md`. Missing permission → **403 `FORBIDDEN`**. Every mutating admin call writes an audit-log entry (actor, action, target, IP, before/after).

- Tables share one query contract: `tab`, `search`, `filter[...]` (flattened as `status=`, `country=`…), `sort` (`field` or `-field`), `page`, `per_page`; responses include `meta.counts` (badge count per tab, e.g. `{ "all": 12418, "pending_kyc": 38 }`) besides the standard pagination meta.
- **Dual control.** Refunds > $1,000, payouts > $2,000 and any fee/escrow/settings change return `{ "status": "pending_approval", "approver": "…" }` instead of applying immediately. A second staff member with the same permission approves in the relevant queue.
- Impersonation (`users.impersonate`) returns a short-lived, read-only token and is always audit-logged and visible to the user.
- KYC document URLs in `/admin/kyc/{id}` must be signed, short-lived Cloudinary *authenticated* delivery URLs.
"""),
}

ORDER = list(DOCS.keys())


def fence(obj):
    return '```json\n' + json.dumps(obj, indent=2, ensure_ascii=False) + '\n```'


for doc in ORDER:
    title, intro = DOCS[doc]
    rows = [s for s in samples if s['doc'] == doc]
    lines = [f'# {title}', '', '> Wire format (snake_case) exactly as the mock server emits it, captured from `src/mocks/` with', '> `tests/unit/contract-payloads.spec.ts` (regenerate with `npm run docs:payloads`). Long arrays are truncated with `"… N more"`.', '> Base URL: `{VITE_API_BASE_URL}` = `https://api.pilotwardrobe.com/api/v1`.', '', intro.strip(), '', '## Samples', '']
    for s in rows:
        q = ''
        if s.get('params'):
            q = '?' + urlencode({k: v for k, v in s['params'].items()})
        lines.append(f"### {s['title']}")
        lines.append('')
        lines.append(f"`{s['method']} {s['url']}{q}` · as {WHO.get(s.get('as'), s.get('as'))}")
        lines.append('')
        if s.get('request') is not None:
            lines.append('Request:')
            lines.append('')
            lines.append(fence(s['request']) if not isinstance(s['request'], str) else f"`{s['request']}`")
            lines.append('')
        lines.append(f"Response `{s['status']}`:")
        lines.append('')
        lines.append(fence(s['response']) if s['response'] is not None else '_(empty body)_')
        lines.append('')
    (out / f'{doc}.md').write_text('\n'.join(lines), encoding='utf-8', newline='\n')
    print(doc, len(rows))

index = ['# API payload samples', '', 'One file per domain. Every sample was produced by the in-browser mock server, which serialises exactly like the Laravel API is expected to (see `docs/backend-api-contract.md`).', '']
for doc in ORDER:
    index.append(f'- [{DOCS[doc][0]}]({doc}.md)')
(out / 'README.md').write_text('\n'.join(index) + '\n', encoding='utf-8', newline='\n')
