# Stage 1: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Copy entire monorepo (or use .dockerignore to trim)
COPY . .

# Install all dependencies across workspaces
RUN npm install

# Build this specific workspace
RUN npm run --workspace=delivery-worker build

# Stage 2: Runtime image
FROM node:20-slim
WORKDIR /app

COPY . .

RUN npm install --workspace=delivery-worker --omit=dev

WORKDIR /app/delivery-worker
CMD ["node", "dist/worker.js"]