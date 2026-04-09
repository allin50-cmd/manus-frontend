FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

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
