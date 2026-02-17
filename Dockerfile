# ============================================================================
# VaultLine Brand Suite – Production Dockerfile
# Multi-stage build optimised for Azure App Service (Linux)
# ============================================================================

# ---------- Stage 1: Install ALL deps and build the frontend ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Copy dependency manifests first (Docker layer caching)
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (dev + prod) for the build step
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the Vite frontend → /app/dist
RUN pnpm build

# ---------- Stage 2: Production-only dependencies ----------
FROM node:20-alpine AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8 --activate

COPY package.json pnpm-lock.yaml ./

# Install production dependencies only (no devDependencies)
RUN pnpm install --frozen-lockfile --prod

# ---------- Stage 3: Final slim runtime image ----------
FROM node:20-alpine AS runtime

# Add tini for proper PID 1 signal handling (graceful shutdown)
RUN apk add --no-cache tini

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server source (tsx compiles on the fly)
COPY server ./server
COPY package.json ./
COPY drizzle.config.ts ./

# Install tsx globally for running TypeScript server in production
# (alternative: compile to JS — but tsx is simpler and works well)
RUN npm install -g tsx

# Copy drizzle migrations if they exist
COPY drizzle ./drizzle

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Azure App Service expects port 8080 by default
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Run database migrations then start server
CMD ["sh", "-c", "tsx server/db/migrate.ts 2>/dev/null; tsx server/index.ts"]
