# Multi-stage build for @sker/studio
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./

# Copy studio app package.json first for better layer caching
COPY apps/studio/package.json ./apps/studio/

# Copy packages directory structure 
COPY packages/ ./packages/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

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
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/apps/studio/dist /usr/share/nginx/html

# Create directory for nginx configs
RUN mkdir -p /etc/nginx/conf.d

# Copy nginx configuration (will be created next)
COPY apps/studio/nginx.conf /etc/nginx/nginx.conf
COPY apps/studio/default.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN addgroup -g 1001 -S nginx || true && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

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