FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build-time placeholder env vars — real values are injected at runtime via App Service settings.
# Values are chosen to pass the assertPrefix checks in src/config.ts (sk_/whsec_/price_).
RUN NEXT_PHASE=phase-production-build \
    DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    STRIPE_SECRET_KEY="sk_test_buildplaceholder" \
    STRIPE_WEBHOOK_SECRET="whsec_buildplaceholder" \
    STRIPE_PRICE_ACCOUNTS_FILING="price_buildplaceholder" \
    STRIPE_PRICE_CONFIRMATION_STATEMENT="price_buildplaceholder" \
    STRIPE_PRICE_STRIKE_OFF="price_buildplaceholder" \
    COMPANIES_HOUSE_API_KEY="placeholder" \
    npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# HOSTNAME=0.0.0.0 is required: Next.js standalone server.js defaults to
# localhost which is unreachable from outside the container. Without this
# all external HTTP connections are rejected with TCP RST (ECONNRESET).
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

# Copy standalone server + its bundled node_modules
COPY --from=builder /app/.next/standalone ./

# Copy static assets (not included in standalone automatically)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER node
EXPOSE 8080
CMD ["node", "server.js"]
