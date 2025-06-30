# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Stage 2: Runtime
FROM node:20-slim
WORKDIR /app

# Only install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built output from builder stage
COPY --from=builder /app/dist ./dist

# Run the compiled worker
CMD ["node", "dist/worker.js"]
