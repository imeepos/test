# Multi-stage build for @sker/studio
ARG NODE_VERSION=18.20.5
ARG ALPINE_VERSION=3.20
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

LABEL maintainer="sker-team"
LABEL description="Studio application for sker platform"
LABEL org.opencontainers.image.source="https://github.com/sker-team/sker"
LABEL org.opencontainers.image.version="1.0.0"

# Set working directory
WORKDIR /app

# Install pnpm
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all package.json files first for better layer caching
COPY apps/studio/package.json ./apps/studio/
COPY packages/*/package.json ./packages/

# Install all workspace dependencies with cache mount
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy configuration files
COPY tsconfig.json ./

# Copy and build packages separately for better cache granularity
COPY packages/config/ ./packages/config/
RUN pnpm --filter @sker/config build

COPY packages/models/ ./packages/models/
RUN pnpm --filter @sker/models build

COPY packages/store/ ./packages/store/
RUN pnpm --filter @sker/store build

COPY packages/store-client/ ./packages/store-client/
RUN pnpm --filter @sker/store-client build

# Copy remaining packages if any (for future dependencies)
COPY packages/ ./packages/

# Copy studio app source files
COPY apps/studio/src ./apps/studio/src
COPY apps/studio/index.html ./apps/studio/
COPY apps/studio/vite.config.ts ./apps/studio/
COPY apps/studio/tsconfig.json ./apps/studio/
COPY apps/studio/tsconfig.node.json ./apps/studio/
COPY apps/studio/tailwind.config.js ./apps/studio/
COPY apps/studio/postcss.config.js ./apps/studio/

# Build studio app using workspace filter (avoids global TypeScript checking)
RUN pnpm --filter @sker/studio build

# Production stage with nginx
FROM nginx:1.27-alpine AS production

# Install curl for health checks (nginx user already exists in nginx:alpine image)
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/apps/studio/dist /usr/share/nginx/html

# Create directory for nginx configs
RUN mkdir -p /etc/nginx/conf.d

# Copy nginx configuration (will be created next)
COPY apps/studio/nginx.conf /etc/nginx/nginx.conf
COPY apps/studio/default.conf /etc/nginx/conf.d/default.conf

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /tmp && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /tmp /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod 755 /tmp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Expose port
EXPOSE 80

# Switch to non-root user
USER nginx

# Start nginx
CMD ["nginx", "-g", "daemon off;"]