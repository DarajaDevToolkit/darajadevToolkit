# The build context must be the parent directory, e.g., 'darajadevToolkit'
# Run build with: docker build -f dashboard/Dockerfile -t dashboard .
FROM node:alpine3.22 AS builder

# Set the working directory to the root of the monorepo
WORKDIR /app

# Copy all package manifests and the lock file
# This allows us to leverage Docker's layer caching
COPY package.json package-lock.json* ./
COPY dashboard/package.json ./dashboard/
COPY shared/package.json ./shared/

# Copy the source code for the shared package
COPY shared ./shared

# Install all dependencies for the entire monorepo
# npm will handle the workspace linking automatically
RUN npm install

# Copy the rest of the dashboard source code
COPY dashboard ./dashboard

# Run the build command from within the dashboard's context
RUN npm run build -w @daraja-toolkit/dashboard

# --- Production image ---
FROM node:alpine3.22 AS runner
WORKDIR /app

# Copy the pruned production node_modules from the builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dashboard/node_modules ./dashboard/node_modules

# Copy the dashboard's package.json
COPY --from=builder /app/dashboard/package.json ./dashboard/package.json

# Copy the built application
COPY --from=builder /app/dashboard/.next ./dashboard/.next
COPY --from=builder /app/dashboard/public ./dashboard/public
COPY --from=builder /app/dashboard/next.config.js ./dashboard/

# Set the working directory to the dashboard
WORKDIR /app/dashboard

EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start"]
