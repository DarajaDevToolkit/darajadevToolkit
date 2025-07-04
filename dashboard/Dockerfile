# ------------ Build Stage ------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY dashboard/package.json ./dashboard/
COPY shared/package.json ./shared/
COPY shared ./shared

RUN npm ci

COPY dashboard ./dashboard

WORKDIR /app/dashboard
RUN npm run build

# Optional: prune devDeps
RUN npm prune --omit=dev

# ------------ Runtime Stage using Distroless ------------
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

COPY --from=builder /app/dashboard/.next ./.next
COPY --from=builder /app/dashboard/public ./public
COPY --from=builder /app/dashboard/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
