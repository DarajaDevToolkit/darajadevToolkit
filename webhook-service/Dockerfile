# ------------ Build & Runtime Stage (Bun handles both) ------------
FROM oven/bun:1

WORKDIR /app

# Copy root-level bun files
COPY package.json bun.lock ./

# Copy workspace manifests
COPY webhook-service/package.json ./webhook-service/
COPY shared/package.json ./shared/

# Copy source code
COPY dashboard ./dashboard
COPY cli ./cli
COPY delivery-worker ./delivery-worker
COPY shared ./shared
COPY webhook-service ./webhook-service

# ✅ Bun install (no npm-force-resolutions)
RUN bun install

WORKDIR /app/webhook-service

EXPOSE 3000

CMD ["bun", "run", "start"]
