# Builder stage — compile frontend assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
# Install production deps (tsx is in dependencies so it is included)
RUN npm ci --omit=dev
# Frontend static assets built by Vite
COPY --from=builder /app/dist ./dist
# Server TypeScript source (tsx executes it directly at runtime)
COPY server ./server
# Shared config needed by server at startup
COPY drizzle.config.ts drizzle.clerkos.config.ts ./

USER node
EXPOSE 3000
# tsx runs the server directly — no separate compile step needed
CMD ["npx", "tsx", "server/index.ts"]
