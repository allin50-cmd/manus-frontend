# ── Stage 1: Build client ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:client

# ── Stage 2: Production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Install production dependencies (tsx is in dependencies, so it's included)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Copy server source (tsx transpiles at runtime — no separate compile step needed)
COPY server ./server

ENV NODE_ENV=production
EXPOSE 3000

# Health check — waits 10s for startup, then checks every 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

USER node
CMD ["node_modules/.bin/tsx", "server/index.ts"]
