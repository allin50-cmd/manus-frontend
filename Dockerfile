FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# NEXT_PHASE tells env.ts (and Next.js internals) this is a build — not runtime.
# DATABASE_URL is intentionally absent here; it is injected at runtime via App Service env vars.
RUN NEXT_PHASE=phase-production-build npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy standalone server + its bundled node_modules
COPY --from=builder /app/.next/standalone ./

# Copy static assets (not included in standalone automatically)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER node
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
