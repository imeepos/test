# 多阶段构建：构建阶段
ARG NODE_VERSION=18.20.5
ARG ALPINE_VERSION=3.20
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

LABEL maintainer="sker-team"
LABEL description="Store service for sker platform"
LABEL org.opencontainers.image.source="https://github.com/sker-team/sker"
LABEL org.opencontainers.image.version="1.0.0"

WORKDIR /app

# 安装指定版本的 pnpm
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}

# 复制工作区配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制所有 package.json 文件
COPY packages/store/package.json ./packages/store/
COPY packages/models/package.json ./packages/models/
COPY packages/config/package.json ./packages/config/

# 安装所有依赖（使用缓存挂载）
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# 复制根目录 tsconfig.json
COPY tsconfig.json ./

# 复制所有包的源代码和配置文件
COPY packages/config/src/ ./packages/config/src/
COPY packages/config/tsup.config.ts ./packages/config/tsup.config.ts
COPY packages/config/tsconfig.json ./packages/config/tsconfig.json

COPY packages/models/src/ ./packages/models/src/
COPY packages/models/tsup.config.ts ./packages/models/tsup.config.ts
COPY packages/models/tsconfig.json ./packages/models/tsconfig.json

COPY packages/store/src/ ./packages/store/src/
COPY packages/store/tsup.config.ts ./packages/store/tsup.config.ts
COPY packages/store/tsconfig.json ./packages/store/tsconfig.json
COPY packages/store/docker-entrypoint.sh ./packages/store/docker-entrypoint.sh

# 按正确顺序构建依赖包
RUN pnpm --filter @sker/config run build && \
    pnpm --filter @sker/models run build && \
    pnpm --filter @sker/store run build

# 生产阶段：运行时镜像
ARG NODE_VERSION=18.20.5
ARG ALPINE_VERSION=3.20
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runtime

WORKDIR /app

# 安装必要的工具：curl, postgresql-client, redis
ARG PNPM_VERSION
RUN apk add --no-cache curl postgresql-client redis bash && \
    npm install -g pnpm@${PNPM_VERSION}

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S store -u 1001

# 复制工作区配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制包配置文件
COPY packages/store/package.json ./packages/store/
COPY packages/models/package.json ./packages/models/
COPY packages/config/package.json ./packages/config/

# 仅安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制构建产物(使用 --chown)
COPY --from=builder --chown=store:nodejs /app/packages/config/dist/ ./packages/config/dist/
COPY --from=builder --chown=store:nodejs /app/packages/models/dist/ ./packages/models/dist/
COPY --from=builder --chown=store:nodejs /app/packages/store/dist/ ./packages/store/dist/

# 复制迁移文件
COPY --from=builder --chown=store:nodejs /app/packages/store/src/migrations/ ./packages/store/src/migrations/

# 切换到store包目录
WORKDIR /app/packages/store

# 切换到非root用户
USER store

# 暴露端口
EXPOSE 3001

# 健康检查：尝试HTTP请求到应用
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# 运行应用（直接在服务启动前执行迁移）
CMD sh -c "node dist/cli-migrate.js && node dist/server.js"