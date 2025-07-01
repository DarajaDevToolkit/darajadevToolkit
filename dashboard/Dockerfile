# ------------ Build Stage ------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo root dependencies and workspace packages
COPY package.json package-lock.json* ./
COPY dashboard/package.json ./dashboard/
COPY shared/package.json ./shared/

# Copy source code for shared packages
COPY shared ./shared

# Install all dependencies (uses npm workspaces)
RUN npm ci

# Copy dashboard source AFTER install for better caching
COPY dashboard ./dashboard

# Build dashboard app from workspace
RUN npm run build -w @daraja-toolkit/dashboard

# ------------ Runtime Stage ------------
FROM node:20-alpine AS runner

WORKDIR /app

# Copy pruned node_modules (incl. workspace deps)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dashboard/node_modules ./dashboard/node_modules

# Copy dashboard build and config
COPY --from=builder /app/dashboard/.next ./dashboard/.next
COPY --from=builder /app/dashboard/public ./dashboard/public
COPY --from=builder /app/dashboard/next.config.js ./dashboard/
COPY --from=builder /app/dashboard/package.json ./dashboard/package.json

# Use dashboard directory as entrypoint context
WORKDIR /app/dashboard

EXPOSE 3000
CMD ["npm", "start"]
