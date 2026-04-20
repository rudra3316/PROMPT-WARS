# ── Stage 1: Build React Frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy root package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy all source files for build
COPY . .

# Build the Vite app (output goes to /app/dist)
RUN npm run build

# ── Stage 2: Node.js Server ───────────────────────────────────────────────────
FROM node:20-alpine AS server

WORKDIR /app/server

# Copy server package files and install
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev

# Copy server source
COPY server/index.js ./

# Copy the built frontend from Stage 1
COPY --from=frontend-builder /app/dist /app/dist

# Cloud Run dynamically assigns $PORT — default to 8080
ENV PORT=8080
ENV NODE_ENV=production

# Tell the server to also serve static files from /app/dist
ENV STATIC_DIR=/app/dist

EXPOSE 8080

CMD ["node", "index.js"]
