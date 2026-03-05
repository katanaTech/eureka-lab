# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./

# Copy package.json files for all workspaces
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/ai-prompts/package.json packages/ai-prompts/
COPY packages/ui/package.json packages/ui/
COPY apps/api/package.json apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared-types/ packages/shared-types/
COPY packages/ai-prompts/ packages/ai-prompts/
COPY packages/ui/ packages/ui/
COPY apps/api/ apps/api/

# Build shared packages + API
RUN pnpm turbo build --filter=@eureka-lab/api...

# ── Stage 2: Runtime ───────────────────────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/shared-types/package.json packages/shared-types/
COPY --from=builder /app/packages/shared-types/dist/ packages/shared-types/dist/
COPY --from=builder /app/packages/ai-prompts/package.json packages/ai-prompts/
COPY --from=builder /app/packages/ai-prompts/dist/ packages/ai-prompts/dist/
COPY --from=builder /app/packages/ui/package.json packages/ui/
COPY --from=builder /app/apps/api/package.json apps/api/
COPY --from=builder /app/apps/api/dist/ apps/api/dist/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

EXPOSE 3011

CMD ["node", "apps/api/dist/main.js"]
