FROM node:18-alpine

WORKDIR /app

# Copy root package files for workspace setup
COPY package.json pnpm-lock.yaml ./
COPY packages/gateway/package.json ./packages/gateway/
COPY packages/models/package.json ./packages/models/
COPY packages/config/package.json ./packages/config/
COPY packages/broker/package.json ./packages/broker/
COPY packages/store/package.json ./packages/store/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/gateway/ ./packages/gateway/
COPY packages/models/ ./packages/models/
COPY packages/config/ ./packages/config/
COPY packages/broker/dist/ ./packages/broker/dist/
COPY packages/store/dist/ ./packages/store/dist/
COPY tsconfig.json ./
COPY packages/gateway/vite.config.ts ./packages/gateway/

# Build the application
WORKDIR /app/packages/gateway
RUN pnpm run build

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Run the application
CMD ["node", "dist/server.js"]