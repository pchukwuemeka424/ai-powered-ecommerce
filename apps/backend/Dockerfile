FROM node:20-alpine AS base
RUN corepack enable pnpm

# ─── Dependencies ─────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/utils/package.json ./packages/utils/
COPY packages/memory/package.json ./packages/memory/
COPY packages/analytics/package.json ./packages/analytics/
COPY packages/orchestrator/package.json ./packages/orchestrator/
COPY packages/templates/package.json ./packages/templates/
RUN pnpm install --frozen-lockfile --filter backend... 2>/dev/null || pnpm install --filter backend...

# ─── Build ────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY . .
RUN pnpm --filter @agentic/utils build 2>/dev/null || true
RUN pnpm --filter @agentic/memory build 2>/dev/null || true
RUN pnpm --filter @agentic/analytics build 2>/dev/null || true
RUN pnpm --filter @agentic/orchestrator build 2>/dev/null || true
RUN pnpm --filter @agentic/templates build 2>/dev/null || true
RUN pnpm --filter backend build

# ─── Production ───────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN corepack enable pnpm
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 api

RUN mkdir -p /app/uploads && chown api:nodejs /app/uploads

COPY --from=builder --chown=api:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=api:nodejs /app/apps/backend/package.json ./
COPY --from=builder --chown=api:nodejs /app/node_modules ./node_modules

USER api
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/server.js"]
