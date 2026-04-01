# Agentic E‑commerce

AI-native, multi-tenant ecommerce SaaS: merchants run a dashboard on the apex domain, each store is reachable on its own subdomain, and a Fastify API backs products, orders, analytics, payments, and AI agents.

## Stack

| Layer | Technology |
| --- | --- |
| Monorepo | [pnpm](https://pnpm.io/) workspaces (`apps/*`, `packages/*`) |
| API | Node 20, [Fastify](https://fastify.dev/), JWT, [Mongoose](https://mongoosejs.com/) |
| Web | [Next.js 14](https://nextjs.org/) (App Router), React 18, Tailwind CSS, TanStack Query, Zustand |
| Data | MongoDB 7 |
| AI | OpenAI or [OpenRouter](https://openrouter.ai/) (see `@agentic/orchestrator`) |
| File storage | Local `/uploads` or [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (`BLOB_READ_WRITE_TOKEN`) |
| Production edge | [Traefik](https://traefik.io/) v3 with Let’s Encrypt (DNS-01 via Cloudflare) or [Coolify](https://coolify.io/) (`docker-compose.coolify.yml`) |

## Repository layout

```
apps/
  backend/     # Fastify API (port 4000)
  frontend/    # Next.js app (port 3000)
packages/
  @agentic/utils        # Shared types, logging, validation
  @agentic/templates    # Storefront theme templates
  @agentic/memory       # Long-term store context (MongoDB)
  @agentic/analytics    # Events and metrics
  @agentic/orchestrator # Background AI agent loop
traefik/dynamic/        # Optional Traefik file provider (middlewares)
```

## Prerequisites

- **Node.js** 20+
- **pnpm** 9 (`corepack enable pnpm` or install globally)
- **MongoDB** — local instance or Atlas URI

## Local development

1. **Install dependencies** (from the repo root):

   ```bash
   pnpm install
   ```

2. **Environment** — create a **`.env`** at the repository root (one file for the whole monorepo). The backend and `next.config.mjs` load it automatically. Set at least `MONGODB_URI` and `JWT_SECRET`. For AI features, set **`OPENAI_API_KEY`** *or* **`OPENROUTER_API_KEY`**, and optionally **`AI_MODEL`**.

3. **Run API + web** together:

   ```bash
   pnpm dev
   ```

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - API: [http://localhost:4000](http://localhost:4000) — [`GET /health`](http://localhost:4000/health), [`GET /`](http://localhost:4000/) for a small discovery payload

4. **Build** (compiles workspace packages used by the apps, then backend + frontend):

   ```bash
   pnpm build
   ```

5. **Optional scripts**

   | Command | Purpose |
   | --- | --- |
   | `pnpm seed` | Seed data via backend script |
   | `pnpm migrate:products` | Product flags migration |
   | `pnpm lint` | Typecheck/lint across workspaces |

### Frontend API URL

If you do not set `NEXT_PUBLIC_API_URL`, the app defaults to **`http://localhost:4000`**. For production or custom ports, set `NEXT_PUBLIC_API_URL` to the public API origin (no trailing slash). Server-side requests in Docker use **`INTERNAL_API_URL`** (e.g. `http://backend:4000`) when the browser URL differs from the internal service name.

Set **`APP_DOMAIN`** and **`NEXT_PUBLIC_APP_DOMAIN`** to the same apex (e.g. `example.com`). The API then allows CORS from that apex, `www`, **`api.<domain>`**, and **any `*.<domain>`** storefront host, in addition to comma-separated **`CORS_ORIGIN`**. The auth cookie uses **`secure`** and a **`.<domain>`** scope on HTTPS so the browser sends it to **`api.<domain>`** and subdomains.

## HTTP API (overview)

All JSON APIs are under **`/api/v1`**:

| Prefix | Area |
| --- | --- |
| `/api/v1/auth` | Register, login, session |
| `/api/v1/stores` | Tenants, subdomains, templates, uploads |
| `/api/v1/products` | Catalog |
| `/api/v1/orders` | Orders |
| `/api/v1/agents` | AI agent actions |
| `/api/v1/analytics` | Tracking + dashboards (`/track` is public) |
| `/api/v1/customers` | Customers |
| `/api/v1/payments` | Payments |

The orchestrator runs in-process after MongoDB connects; health responses include basic orchestrator stats.

## Docker (production-style)

**`docker-compose.yml`** runs Traefik (80/443), MongoDB, backend, and frontend on a shared network. It expects DNS and secrets for wildcard TLS (e.g. **`CF_DNS_API_TOKEN`**, **`ACME_EMAIL`**, **`APP_DOMAIN`**). Set **`TRAEFIK_DASHBOARD_AUTH`** for basic auth on the Traefik dashboard host.

Configure a `.env` in the repo root (see variables above), then:

```bash
docker compose up -d --build
```

(`pnpm docker:up` runs `docker-compose up -d` if you prefer the root scripts.)

**`docker-compose.coolify.yml`** is the same app stack **without** Traefik (for platforms that terminate HTTPS and route to services). Use the same build context (repository root).

## Environment variables (reference)

Variables commonly used locally or in compose (names only—use your own secret values):

| Variable | Role |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Optional JWT lifetime (default long-lived in app) |
| `OPENAI_API_KEY` / `OPENROUTER_API_KEY` | AI providers (one required for agents) |
| `AI_MODEL` | Model id (OpenAI vs OpenRouter defaults differ in code) |
| `APP_DOMAIN` / `APP_URL` | Public domain and canonical URL (CORS, OpenRouter referrer) |
| `CORS_ORIGIN` | Comma-separated allowed origins |
| `PUBLIC_API_URL` | Public API URL for server-side use |
| `BLOB_READ_WRITE_TOKEN` | Optional Vercel Blob for uploads |
| `NEXT_PUBLIC_API_URL` | Browser-visible API origin |
| `NEXT_PUBLIC_APP_DOMAIN` | Apex domain for the Next.js app |
| `INTERNAL_API_URL` | Server-side API base inside Docker |
| `CF_DNS_API_TOKEN`, `ACME_EMAIL`, `TRAEFIK_DASHBOARD_AUTH` | Traefik / Let’s Encrypt |

## UI routes (frontend)

- **Marketing / auth**: `/`, `/auth/login`, `/auth/register`, template selection during onboarding.
- **Dashboard** (merchant): `/dashboard`, `/dashboard/products`, `/dashboard/orders`, `/dashboard/customers`, `/dashboard/analytics`, `/dashboard/agents`, `/dashboard/payments`, `/dashboard/settings`, `/dashboard/site`, `/dashboard/theme`, `/dashboard/navigation`, `/dashboard/domains`, `/dashboard/preview`.
- **Storefront** (by subdomain): `/store/[subdomain]`, products, checkout, and payment success flows.
