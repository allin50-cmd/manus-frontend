# FineGuard MTD — Multi-stage Dockerfile
# Stage 1: development deps + build
# Stage 2: production-only runtime

# ─── Base ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

# ─── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --include=dev

# ─── Development ──────────────────────────────────────────────────────────────
FROM deps AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "server:watch"]

# ─── Build ────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN npm run build

# ─── Production ───────────────────────────────────────────────────────────────
FROM base AS production

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "--loader", "ts-node/esm", "server/index.ts"]
