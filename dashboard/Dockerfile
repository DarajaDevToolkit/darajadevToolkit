# ------------ Build Stage ------------
FROM node:20-bookworm AS builder

WORKDIR /app

# Copy monorepo-level package metadata
COPY package*.json ./
COPY dashboard/package.json ./dashboard/
COPY shared/package.json ./shared/

# Copy shared package source early for better caching
COPY shared ./shared

# Install only production and workspace deps
RUN npm ci

# Copy dashboard source and build it
COPY dashboard ./dashboard
WORKDIR /app/dashboard

# Build the Next.js app
RUN npm run build

# Optional: prune devDependencies for smaller runtime
RUN npm prune --omit=dev

# ------------ Runtime Stage (Distroless) ------------
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

# Copy the built .next folder and public assets
COPY --from=builder /app/dashboard/.next ./.next
COPY --from=builder /app/dashboard/public ./public
COPY --from=builder /app/dashboard/package.json ./package.json

# Copy pruned production node_modules
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Use the standalone server.js for Next.js
CMD ["node", ".next/standalone/server.js"]
