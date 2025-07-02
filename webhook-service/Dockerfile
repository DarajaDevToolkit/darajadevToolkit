# ------------ Build & Runtime Stage (Bun handles both) ------------
FROM oven/bun:1

# Use monorepo root as working directory
WORKDIR /app

# Copy root-level package files
COPY package.json bun.lock ./

# Copy workspace packages' manifests for cache efficiency
COPY webhook-service/package.json ./webhook-service/
COPY shared/package.json ./shared/

# Copy source code
COPY dashboard ./dashboard
COPY cli ./cli
COPY delivery-worker ./delivery-worker
COPY shared ./shared
COPY webhook-service ./webhook-service


# Install all dependencies (Bun will link workspace packages correctly)
RUN bun install
# Set working directory to the service
WORKDIR /app/webhook-service

EXPOSE 3000

# Start the service
CMD ["bun", "run", "start"]
