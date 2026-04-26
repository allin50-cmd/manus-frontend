# Builder — installs all deps and builds the React frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Builds frontend → dist/  (tsc does type-check only; vite emits the bundle)
RUN npm run build

# Runtime — production deps + server source + built frontend
FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
# tsx is in dependencies so it survives --omit=dev
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY server ./server
USER node
EXPOSE 3000
# tsx runs the TypeScript server directly; no separate compile step needed
CMD ["node_modules/.bin/tsx", "server/index.ts"]
