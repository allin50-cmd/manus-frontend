# ============================================================================
# VaultLine Brand Suite – Production Dockerfile
# Multi-stage build: builder → runtime
# ============================================================================

# ---------- Stage 1: Install ALL deps and build the frontend ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (Docker layer caching)
COPY package.json ./

# Install all dependencies (dev + prod) for the build step
RUN npm install

# Copy source code
COPY . .

# Build the Vite frontend → /app/dist
RUN npm run build

# ---------- Stage 2: Production-only dependencies ----------
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json ./

# Install production dependencies only (no devDependencies)
# tsx is a production dependency so it will be included here
RUN npm install --omit=dev

# ---------- Stage 3: Final slim runtime image ----------
FROM node:20-alpine AS runtime

# Add tini for proper PID 1 signal handling (graceful shutdown)
RUN apk add --no-cache tini

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy production node_modules from deps stage (includes tsx)
COPY --from=deps /app/node_modules ./node_modules

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server source (tsx runs TypeScript directly at runtime)
COPY server ./server
COPY package.json ./
COPY drizzle.config.ts ./

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Azure App Service expects port 8080 by default
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Run database migrations then start server using tsx from node_modules
# (no global tsx install needed – tsx is a production dependency)
CMD ["sh", "-c", "node_modules/.bin/tsx server/db/migrate.ts 2>/dev/null; node_modules/.bin/tsx server/index.ts"]
