FROM node:18-alpine

WORKDIR /app

# Copy root package files for workspace setup
COPY package.json pnpm-lock.yaml ./
COPY packages/broker/package.json ./packages/broker/
COPY packages/models/package.json ./packages/models/
COPY packages/config/package.json ./packages/config/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/broker/ ./packages/broker/
COPY packages/models/ ./packages/models/
COPY packages/config/ ./packages/config/
COPY tsconfig.json ./
COPY packages/broker/vite.config.ts ./packages/broker/

# Build the application
WORKDIR /app/packages/broker
RUN pnpm run build

# Expose port (if the broker service has HTTP endpoints)
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)" # Simple health check for message broker

# Run the application
CMD ["node", "dist/index.js"]