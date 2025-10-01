# Multi-stage build for @sker/research
ARG NODE_VERSION=18.20.5
ARG ALPINE_VERSION=3.20
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} as builder

LABEL maintainer="sker-team"
LABEL description="Research application for sker platform"
LABEL org.opencontainers.image.source="https://github.com/sker-team/sker"
LABEL org.opencontainers.image.version="1.0.0"

# Set working directory
WORKDIR /app

# Install pnpm, Python and R for academic computing
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION} && \
    apk add --no-cache \
    python3 \
    python3-dev \
    py3-pip \
    build-base \
    R \
    R-dev \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    gif-dev \
    librsvg-dev

# Copy root package files for workspace setup
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all package.json files
COPY apps/research/package.json ./apps/research/
COPY packages/utils/package.json ./packages/utils/
COPY packages/store/package.json ./packages/store/
COPY packages/gateway/package.json ./packages/gateway/
COPY packages/engine/package.json ./packages/engine/
COPY packages/broker/package.json ./packages/broker/

# Install dependencies with cache mount
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy workspace configuration
COPY tsconfig.json ./

# Copy and build shared packages separately for better cache granularity
COPY packages/utils/ ./packages/utils/
RUN pnpm --filter @sker/utils build

COPY packages/store/ ./packages/store/
RUN pnpm --filter @sker/store build

# Copy research app source
COPY apps/research/ ./apps/research/

# Install Python scientific packages for academic computing
RUN pip3 install --no-cache-dir \
    numpy \
    pandas \
    scipy \
    matplotlib \
    seaborn \
    scikit-learn \
    jupyter \
    pypdf2 \
    python-docx

# Install R packages for statistical analysis
RUN R -e "install.packages(c('ggplot2', 'dplyr', 'tidyr', 'readr', 'jsonlite'), repos='https://cran.r-project.org')"

# Build the research application
WORKDIR /app/apps/research
RUN pnpm run build

# Production stage with nginx
ARG NGINX_VERSION=1.27

FROM nginx:${NGINX_VERSION}-alpine as production

# Install Node.js and curl
RUN apk add --no-cache nodejs npm curl

# Copy built application
COPY --from=builder /app/apps/research/dist /usr/share/nginx/html

# Create directory for nginx configs
RUN mkdir -p /etc/nginx/conf.d

# Copy nginx configuration
COPY apps/research/nginx.conf /etc/nginx/nginx.conf
COPY apps/research/default.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx && \
    mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Expose port
EXPOSE 80

# Switch to non-root user
USER nginx

# Start nginx
CMD ["nginx", "-g", "daemon off;"]