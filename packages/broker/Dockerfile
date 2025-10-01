# 多阶段构建：构建阶段
ARG NODE_VERSION=18.20.5
ARG ALPINE_VERSION=3.20
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

LABEL maintainer="sker-team"
LABEL description="Broker service for sker platform"
LABEL org.opencontainers.image.source="https://github.com/sker-team/sker"
LABEL org.opencontainers.image.version="1.0.0"

WORKDIR /app

# 安装指定版本的 pnpm
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}

# 复制工作区配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制所有 package.json 文件
COPY packages/broker/package.json ./packages/broker/
COPY packages/models/package.json ./packages/models/
COPY packages/config/package.json ./packages/config/
COPY packages/store/package.json ./packages/store/

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

COPY packages/broker/src/ ./packages/broker/src/
COPY packages/broker/tsup.config.ts ./packages/broker/tsup.config.ts
COPY packages/broker/tsconfig.json ./packages/broker/tsconfig.json

# 按依赖顺序构建包
RUN pnpm --filter @sker/config run build && \
    pnpm --filter @sker/models run build && \
    pnpm --filter @sker/store run build && \
    pnpm --filter @sker/broker run build

# 生产阶段：运行时镜像
ARG NODE_VERSION=18.20.5
ARG ALPINE_VERSION=3.20
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runtime

WORKDIR /app

# 安装curl和pnpm
ARG PNPM_VERSION
RUN apk add --no-cache curl && \
    npm install -g pnpm@${PNPM_VERSION}

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S broker -u 1001

# 复制工作区配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制包配置文件
COPY packages/broker/package.json ./packages/broker/
COPY packages/models/package.json ./packages/models/
COPY packages/config/package.json ./packages/config/
COPY packages/store/package.json ./packages/store/

# 仅安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制构建产物(使用 --chown)
COPY --from=builder --chown=broker:nodejs /app/packages/config/dist/ ./packages/config/dist/
COPY --from=builder --chown=broker:nodejs /app/packages/models/dist/ ./packages/models/dist/
COPY --from=builder --chown=broker:nodejs /app/packages/store/dist/ ./packages/store/dist/
COPY --from=builder --chown=broker:nodejs /app/packages/broker/dist/ ./packages/broker/dist/

# 切换到broker包目录
WORKDIR /app/packages/broker

# 切换到非root用户
USER broker

# 暴露端口（如果broker服务有HTTP端点）
EXPOSE 3002

# 健康检查：检查HTTP端点
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# 运行应用
CMD ["node", "dist/main.js"]
