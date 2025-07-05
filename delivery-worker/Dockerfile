# ------------ Build Stage ------------
FROM node:20-slim AS builder

WORKDIR /app

# Install curl and Bun

# Install curl and unzip (needed for Bun)
RUN apt-get update && apt-get install -y curl unzip \
  && curl -fsSL https://bun.sh/install | bash \
  && mv /root/.bun/bin/bun /usr/local/bin/ \
  && apt-get remove -y curl unzip && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Copy only necessary files
COPY package*.json ./
COPY delivery-worker/package.json ./delivery-worker/
COPY shared/package.json ./shared/

# Copy the rest of the source
COPY . .

# Install deps and build delivery-worker
RUN npm install
RUN npm run --workspace=delivery-worker build

# ------------ Runtime Stage using Distroless ------------
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

# Copy the compiled output and dependencies
COPY --from=builder /app/delivery-worker/dist ./delivery-worker/dist
COPY --from=builder /app/delivery-worker/node_modules ./delivery-worker/node_modules
COPY --from=builder /app/delivery-worker/package.json ./delivery-worker/package.json

# Required to find node_modules
ENV NODE_PATH=/app/delivery-worker/node_modules

WORKDIR /app/delivery-worker

CMD ["dist/worker.js"]
