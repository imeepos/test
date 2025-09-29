FROM node:18-alpine

WORKDIR /app

# Copy root package files for workspace setup
COPY package.json pnpm-lock.yaml ./
COPY packages/engine/package.json ./packages/engine/
COPY packages/models/package.json ./packages/models/
COPY packages/config/package.json ./packages/config/
COPY packages/ai/package.json ./packages/ai/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/engine/ ./packages/engine/
COPY packages/models/ ./packages/models/
COPY packages/config/ ./packages/config/
COPY packages/ai/ ./packages/ai/
COPY tsconfig.json ./
COPY packages/engine/vite.config.ts ./packages/engine/

# Build the application
WORKDIR /app/packages/engine
RUN pnpm run build

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Run the application
CMD ["node", "dist/server/index.js"]