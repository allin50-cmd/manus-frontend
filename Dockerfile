# Builder stage — compiles both frontend (Vite) and server (tsc)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
# Build frontend assets into dist/
RUN npm run build
# Compile server TypeScript into dist-server/
RUN npx tsc --project tsconfig.server.json

# Runtime stage
FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
# Frontend static assets
COPY --from=builder /app/dist ./dist
# Compiled server JS
COPY --from=builder /app/dist-server ./dist-server
USER node
EXPOSE 3000
CMD ["node", "dist-server/server/index.js"]
