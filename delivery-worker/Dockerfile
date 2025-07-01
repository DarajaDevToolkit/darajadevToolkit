# Stage 1: Builder
# Stage 1: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Copy full monorepo (adjust as needed)
COPY . .

# Install all workspaces (needed to resolve local deps like @daraja-toolkit/shared)
RUN npm install

# Build the specific workspace
RUN npm run --workspace=delivery-worker build

# Stage 2: Runtime image
FROM node:20-slim
WORKDIR /app

# Copy only what's needed (runtime-only)
COPY . .

# Install prod deps for this workspace only
RUN npm install --workspace=delivery-worker --omit=dev

# Set the working dir to delivery-worker
WORKDIR /app/delivery-worker

CMD ["node", "dist/worker.js"]