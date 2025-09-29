FROM node:18-alpine

WORKDIR /app

# Copy root package files for workspace setup
COPY package.json pnpm-lock.yaml ./
COPY packages/store/package.json ./packages/store/
COPY packages/models/package.json ./packages/models/
COPY packages/config/package.json ./packages/config/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/store/ ./packages/store/
COPY packages/models/ ./packages/models/
COPY packages/config/ ./packages/config/
COPY tsconfig.json ./

# Build dependencies first
WORKDIR /app/packages/models
RUN pnpm run build

WORKDIR /app/packages/config
RUN pnpm run build

# Build the store application
WORKDIR /app/packages/store
RUN pnpm run build

# Expose port
EXPOSE 3001

# Health check - simple process check since we don't have a health endpoint yet
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD pgrep node || exit 1

# Run the application using server.js (built from server.ts)
CMD ["node", "dist/server.js"]