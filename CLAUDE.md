# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Architecture Overview

This is a **multi-tenant SaaS e-commerce platform** — not a single store. It has three distinct surfaces:

| Route group | Path | Purpose |
|-------------|------|---------|
| Storefront | `app/(store)/` | Customer-facing shop |
| Merchant dashboard | `app/(manage)/manage/` | Store owner manages products/orders |
| Platform admin | `app/(manage)/admin/` | Super admin manages all merchants/stores |

### Database: Two-tier SQLite via Drizzle + libSQL

- **Global DB** (`sqlite/global.db`): platform-wide — `users`, `sessions`, `stores`. Defined in `lib/db/schema_global.ts`.
- **Tenant DB** (`sqlite/tenant_<storeId>.db`): per-store isolated data — `products`, `variants`, `orders`, `carts`, `categories`, `collections`. Defined in `lib/db/schema_tenant.ts`.
- `lib/db/index.ts` exports `globalDb` and `getTenantDb(storeId)` (cached connections).
- Migrations are split: `drizzle/global/` and `drizzle/tenant/`.

### Commerce Layer

`lib/commerce.ts` exports a single `commerce` object used throughout the storefront. It is currently backed by `lib/local-commerce.ts` (direct SQLite queries), which implements the same interface as the original Commerce Kit SDK. When adding storefront data access, always go through `commerce.*` methods, never query the DB directly in pages.

### Authentication

- Phone + OTP flow. `lib/auth.ts` handles session creation (JWT in `yns_auth_session` cookie).
- Two roles: `ADMIN` (platform) and `MERCHANT` (store owner).
- Route protection via `lib/guards.ts`: call `protectAdmin()` or `protectMerchant()` at the top of Server Actions and page layouts.
- `proxy.ts` runs in Edge middleware to guard `/manage/*` routes before they reach the server.
- Store context (active `storeId`) is stored in a cookie and read via `getActiveStoreContext()` from `lib/auth.ts`.

### Payments & Shipping

- **Wave** (West African mobile money): `lib/wave/wallets.ts` — split payments between merchant and platform using `commissionRate` on the store.
- **Shipping**: `lib/shipping/ivory-coast-zones.ts` defines delivery zones; `lib/shipping-engine.ts` calculates rates.

### Image Storage

Self-hosted S3-compatible storage via [Garage](https://garagehq.deuxfleurs.fr/). Upload endpoint is `app/api/upload/`. Requires Garage running locally (`docker-compose up -d`) and configured via `scripts/setup-garage.ts`.

### Key env vars (`.env.local`)

```
STORE_ID=<storeId>          # Required for storefront tenant DB lookup
JWT_SECRET=<secret>         # Session signing
AWS_REGION=garage
AWS_BUCKET_NAME=delivery
AWS_ENDPOINT=http://127.0.0.1:3900
YNS_API_KEY=<key>
```
