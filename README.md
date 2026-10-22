# Pilotwardrobe — web

The Vue 3 single-page app for **Pilotwardrobe**, a peer-to-peer marketplace where pilots and crew buy, sell and swap aviation gear (headsets, flight bags, uniforms, aviation photography). It includes the public marketplace, the member area ("My Hangar"), checkout with escrow, messaging and disputes, and the staff **Control Tower** admin.

The app runs fully without a backend: a built-in mock API implements the whole Laravel contract, so you can click through every flow as soon as you install.

## Stack

Vue 3.5 (Composition API, `<script setup lang="ts">`) · TypeScript (strict) · Vite 6 · Vue Router 4 · Pinia 3 · Axios · VueUse · Lucide icons · DOMPurify · Vitest + Vue Test Utils · Playwright · ESLint 9 (flat config) + Prettier.

## Quick start

Requires **Node ≥ 20.19** and npm 10.

```bash
npm install
cp .env.example .env.local      # defaults to the mock API
npm run dev                     # http://localhost:5173
```

### Demo accounts (mock mode)

Every account uses the password **`Password1`**.

| Email | Role | Notes |
|---|---|---|
| `pilot@example.com` | user | KYC approved, has listings, orders, offers, a dispute and a wallet |
| `aviator@example.com` | aviator | 2FA on, code **`123456`** |
| `newbie@example.com` | user | KYC not started, so it shows the verification gates |
| `admin@example.com` | admin | "Trust & safety" staff role: no Settings, Team, Fees or Payout approval |
| `super@example.com` | super_admin | Everything |

Other mock codes:

- Email verification OTP: **`1234`**
- Password reset links: `/auth/reset?token=demo-reset-token` (valid) and `?token=expired-token` (expired)
- Staff sign-in at `/admin/sign-in` simulates Google Workspace SSO followed by a security key, then signs you in as super admin.
- At checkout, the mock gateway page lets you approve, decline or cancel the payment.

The mock keeps state in memory for the tab, and the session in `sessionStorage`. Reload the page to reset all data.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`vue-tsc --build`), then production build to `dist/` |
| `npm run build:only` | Build without type-checking |
| `npm run preview` | Serve `dist/` locally |
| `npm run type-check` | `vue-tsc --build` |
| `npm run lint` / `lint:fix` | ESLint, zero warnings allowed |
| `npm run format` | Prettier |
| `npm test` | Vitest unit, component and contract tests |
| `npm run test:e2e` | Playwright (desktop Chromium + Pixel 7). First run: `npx playwright install chromium` |
| `npm run docs:payloads` | Regenerates `docs/api-payloads/*.md` from the mock server and runs the contract test |
| `npm run images:mock` | Rebuilds the mock image renditions in `public/media/mock` from `docs/PW-images` (needs Python 3 + Pillow) |

`python scripts/generate-api-contract.py` regenerates the endpoint tables in `docs/backend-api-contract.md`.

## Environment

Every `VITE_*` variable is compiled into public JavaScript. **Never** put secrets in them: no gateway secret keys, Cloudinary API secret, ZeptoMail token, Laravel `APP_KEY` or database credentials. `.env` and `.env.*` are gitignored, except `.env.example`.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_APP_NAME` | `Pilotwardrobe` | Title suffix, OG site name |
| `VITE_APP_URL` | `http://localhost:5173` | Canonical URLs, OG URLs |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Laravel API root, including the version |
| `VITE_API_MODE` | `mock` | `mock` serves the in-browser contract fixtures; `live` calls Laravel |
| `VITE_AUTH_MODE` | `cookie` | `cookie` uses a Sanctum SPA session (recommended); `token` uses a Bearer token |
| `VITE_SANCTUM_CSRF_URL` | `http://localhost:8000/sanctum/csrf-cookie` | CSRF bootstrap (cookie mode) |
| `VITE_MOCK_LATENCY_MS` | `350` | Simulated latency for mock responses |
| `VITE_GOOGLE_CLIENT_ID` | — | Public OAuth client id (optional) |

With `VITE_API_MODE=live`, the build removes the mock server, demo hints and mock images (verified: `dist/` contains no mock code).

## Project structure

```
src/
  api/            Axios client (envelope unwrapping, snake↔camel case, errors, CSRF/token), one service per domain
  mocks/          Contract-accurate mock server: fixtures, stateful db, route handlers, axios adapter
  types/          Domain models (camelCase), API envelope and error types, permission catalogue
  stores/         Pinia: auth, ui (toasts/modals/offline), cart, notification, marketplace
  router/         Routes, meta typing, pure access resolver (`access.ts`), guards
  layouts/        Public, Info (guides/policies/support), Account (My Hangar), Checkout, Auth, Admin
  views/          public/ info/ auth/ account/ checkout/ admin/ errors/
  content/info/   Copy for the information centre: sub-nav, FAQs, platform timings (PLATFORM)
  components/     common/ forms/ navigation/ marketplace/ products/ info/ auth/ dashboard/ payments/ transactions/ admin/
  composables/    useResource, useForm, useSeo, useGatedAction, useListingQuery, useAdminTable, useFocusTrap, …
  directives/     v-can
  utils/          money, dates, validators, security (safe redirects, sanitising), analytics, permissions
  styles/         tokens.css (design tokens), base.css
docs/
  pilotwardrobe-designs/        Source designs (authoritative)
  design-screen-inventory.md    Every design frame → route/component, deviations and gaps
  backend-api-contract.md       Endpoint reference, conventions, permissions, email triggers
  frontend-backend-handoff.md   Auth, state machines, media, payments, SEO, go-live checklist
  api-payloads/                 Request/response samples per domain
tests/
  unit/           utils, access resolver, flows, components, API contract
  e2e/            Playwright critical paths
```

## Architecture notes

**Data flow.** Views call domain services (`src/api/*.api.ts`), usually through `useResource`, which handles loading, error and empty states, aborts superseded requests and supports `keepPrevious` for pagination. Services return typed domain objects; the HTTP client unwraps `{ success, data }` and normalises every failure into an `ApiError` with a `code`, `status` and field errors.

**Wire format.** Laravel speaks snake_case and the app uses camelCase. The client converts object keys in both directions at the boundary and never touches values. Money is always integer minor units (`{ amount, currency, formatted? }`), and timestamps are ISO-8601 UTC.

**Mock mode.** Mock mode is an Axios adapter, so the real client runs unchanged (interceptors, case conversion, error mapping); only the transport is swapped. Handlers enforce the same permissions, validation and state transitions the backend must. `tests/unit/contract-payloads.spec.ts` drives the adapter and checks each documented sample.

**Roles and permissions.** There are four roles (`user`, `aviator`, `admin`, `super_admin`) plus the implicit `visitor`. The checks themselves use the **permission list from `GET /auth/me`**, through `can()`, `hasRole()` and `hasAnyRole()` (from `useAuthStore`), the `v-can` directive, and route meta (`requiresAuth`, `guestOnly`, `roles`, `permission`, `requiresKyc`). Guards redirect visitors to `/auth/login?next=…` and send everyone else who lacks access to `/403`. Frontend checks only shape the UX; the backend enforces access. Logging out clears every user-scoped store.

**Payments.** Checkout creates the order, calls `POST /payments/initialize`, and redirects only to an allow-listed gateway host (Stripe, PayPal, Paystack, Flutterwave, Monnify). On return, `/payment/callback` polls `GET /payments/{reference}` until Laravel reports a verified status. Query strings from the gateway are ignored, and there are no card fields anywhere in the app.

**Media.** Images are `MediaAsset` objects that Laravel produces from Cloudinary. `AppImage` renders `<picture>` (AVIF → WebP → JPEG) or `srcset` from the named variants, reserves the aspect ratio from `width`/`height` (no layout shift), lazy-loads below the fold, and uses `fetchpriority=high` for LCP images. Uploads go to `POST /media`; the browser never sees Cloudinary credentials.

**Security.** The app never renders HTML from users. CMS HTML goes through DOMPurify (`SafeHtml`). `next=` redirects must be same-origin relative paths. API error messages are shown, but raw server errors never are. Bearer tokens (token mode only) live in memory and session storage, never in cookies that JavaScript can read.

**Accessibility.** The app targets WCAG 2.1 AA: skip link, landmarks, visible focus, focus-trapped modals and drawers, labelled form controls with `aria-describedby` errors, live regions for toasts and carousel changes, a pausable hero, reduced-motion support, 44 px touch targets, and colour contrast checked against the tokens.

## Connecting to Laravel

1. Set `VITE_API_MODE=live` and `VITE_API_BASE_URL=https://api.example.com/api/v1`.
2. Cookie mode (recommended, same-site deployment): set `VITE_AUTH_MODE=cookie` and `VITE_SANCTUM_CSRF_URL`. On the Laravel side, configure `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN`, and CORS with `supports_credentials=true`.
3. Token mode (cross-site deployment): set `VITE_AUTH_MODE=token`. Login must return `access_token`.
4. Implement the endpoints in `docs/backend-api-contract.md`. `docs/frontend-backend-handoff.md` §13 has the go-live checklist.

### Local Laravel (Laragon, Valet, Herd)

Sanctum's session and `XSRF-TOKEN` cookies are host-only and `SameSite=Lax`, so a SPA on `localhost` can't use them against `https://pilotwardrobe-api.test` directly. Proxy the API through the Vite dev server so the cookies are first-party. Put this in `.env.development.local`:

```env
DEV_API_PROXY=https://pilotwardrobe-api.test   # not VITE_-prefixed: dev server only, never shipped
VITE_API_MODE=live
VITE_AUTH_MODE=cookie
VITE_API_BASE_URL=/api/v1
VITE_SANCTUM_CSRF_URL=/sanctum/csrf-cookie
```

Then run `npm run dev`. Laravel's `SANCTUM_STATEFUL_DOMAINS` must include the dev origin (`localhost:5173`). If you set these variables inline from Git Bash instead, prefix the command with `MSYS_NO_PATHCONV=1`; otherwise Git Bash rewrites `/api/v1` into a Windows path.

## Deployment

`npm run build` writes static files to `dist/`. Serve them from any static host or CDN with:

- **SPA fallback:** unknown paths serve `index.html`. For Nginx: `try_files $uri $uri/ /index.html;`. For Netlify: `/* /index.html 200`. For Vercel: a rewrite to `/index.html`.
- **Caching:** `assets/*` files are content-hashed, so serve them with `Cache-Control: public, max-age=31536000, immutable`. Serve `index.html` with `no-cache`.
- **Security headers:** a CSP allowing `self`, `res.cloudinary.com` and the API origin for `connect-src`, and the gateway hosts for `form-action`/`frame-src` if a popup SDK is used. Also `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Link previews:** the app is client-rendered. Share previews need server-side OG tags; see handoff §11.

### Production pipeline

`.github/workflows/deploy-production.yml` runs on pushes to `main` that change more than documentation, and on manual dispatch:

1. **verify** (lint, type-check, unit tests), **e2e** (Playwright, Chromium) and **build** run in parallel. The build uses the committed `.env.production` and fails if any mock-mode code reaches the bundle.
2. **deploy** runs only when all three pass. It uploads the bundle to `releases/<sha>` over a single multiplexed SSH connection, hard-linking unchanged files from the live release (`rsync --link-dest`), switches `current` atomically, and smoke-tests the site (new entry script served, `/terms` deep link works). If the smoke test fails, it restores the previous release and the run fails. Five releases are kept; the live one is never removed.

### Production SSH setup

The deployment workflow reads `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, and `VPS_KNOWN_HOSTS` from GitHub secrets available to the `production` environment. `VPS_PORT` defaults to `22`. Set `VPS_HOST` to the hostname or IP only, without `https://`, a username, or a port.

To prepare `VPS_KNOWN_HOSTS`, run the following locally with the actual SSH port and host:

```sh
ssh-keyscan -p PORT HOST > vps-known-hosts
ssh-keygen -lf vps-known-hosts
```

Compare the fingerprint with the host key fingerprint shown through the VPS provider's trusted console (`ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` for the server's Ed25519 key). Save only verified key lines from `vps-known-hosts` as the `VPS_KNOWN_HOSTS` secret, then rerun the workflow. This secret contains full known-hosts entries, not just a `SHA256:` fingerprint or the deploy user's public key. Custom ports use `[HOST]:PORT` entries; the workflow also accepts existing hostname entries for the same trusted host. If a stored key is stale, verify the replacement through the VPS console before updating the secret.

## Testing

- **Unit, component and contract tests:** `npm test` (Vitest + jsdom). This covers utils (money, dates, validators, safe redirects), the route access resolver for every role, store and auth flows, key components, and the API contract samples.
- **E2E:** `npm run test:e2e` starts the dev server in mock mode. It covers browsing and filtering, the visitor auth gate preserving its destination, login and protected routes, the 403 page for non-staff, permission-scoped admin navigation, and checkout through the gateway to a verified confirmation, on both desktop and mobile.
