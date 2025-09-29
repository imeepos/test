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

# Build the application
WORKDIR /app/packages/store
RUN pnpm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Run the application
CMD ["node", "dist/index.js"]