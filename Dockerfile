FROM node:20-alpine AS base
RUN corepack enable pnpm

# ─── Install dependencies ────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/utils/package.json ./packages/utils/
COPY packages/memory/package.json ./packages/memory/
COPY packages/analytics/package.json ./packages/analytics/
COPY packages/orchestrator/package.json ./packages/orchestrator/
COPY packages/templates/package.json ./packages/templates/
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# ─── Build everything ────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_DOMAIN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_DOMAIN=$NEXT_PUBLIC_APP_DOMAIN
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app ./
COPY . .

# Workspace packages first (they emit dist/*.d.ts consumed by apps)
RUN pnpm --filter @agentic/utils build
RUN pnpm --filter @agentic/memory build
RUN pnpm --filter @agentic/analytics build
RUN pnpm --filter @agentic/orchestrator build
RUN pnpm --filter @agentic/templates build
# Apps
RUN pnpm --filter backend build
RUN pnpm --filter frontend build

# ─── Production image ────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV API_PORT=4000

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

RUN mkdir -p /app/uploads /app/frontend && chown -R appuser:appgroup /app

# Backend
COPY --from=builder --chown=appuser:appgroup /app/apps/backend/dist ./backend/dist
COPY --from=builder --chown=appuser:appgroup /app/apps/backend/package.json ./backend/
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules

# Frontend (Next.js standalone — monorepo nests server at apps/frontend/)
COPY --from=builder --chown=appuser:appgroup /app/apps/frontend/public ./frontend/public
COPY --from=builder --chown=appuser:appgroup /app/apps/frontend/.next/standalone ./frontend/standalone
COPY --from=builder --chown=appuser:appgroup /app/apps/frontend/.next/static ./frontend/standalone/apps/frontend/.next/static

# Entrypoint
COPY --chown=appuser:appgroup start.sh /app/start.sh
RUN chmod +x /app/start.sh

USER appuser
EXPOSE 4000 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["/app/start.sh"]
