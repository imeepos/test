# Multi-stage build for @sker/research
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Install Python and R for academic computing
RUN apk add --no-cache \
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

# Install pnpm
RUN npm install -g pnpm

# Copy root package files for workspace setup
COPY package.json pnpm-lock.yaml ./
COPY apps/research/package.json ./apps/research/

# Copy shared packages
COPY packages/utils/package.json ./packages/utils/
COPY packages/store/package.json ./packages/store/
COPY packages/gateway/package.json ./packages/gateway/
COPY packages/engine/package.json ./packages/engine/
COPY packages/broker/package.json ./packages/broker/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy workspace configuration
COPY tsconfig.json ./
COPY pnpm-workspace.yaml ./

# Copy shared packages source
COPY packages/utils/ ./packages/utils/
COPY packages/store/src/ ./packages/store/src/
COPY packages/store/tsconfig.json ./packages/store/

# Build shared packages first
RUN cd packages/utils && pnpm run build
RUN cd packages/store && pnpm run build

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
FROM nginx:alpine as production

# Install Node.js for API proxy if needed
RUN apk add --no-cache nodejs npm

# Copy built application
COPY --from=builder /app/apps/research/dist /usr/share/nginx/html

# Create directory for nginx configs
RUN mkdir -p /etc/nginx/conf.d

# Copy nginx configuration
COPY apps/research/nginx.conf /etc/nginx/nginx.conf
COPY apps/research/default.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
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