# 多阶段构建：构建阶段
ARG NODE_VERSION=18.20.5
ARG ALPINE_VERSION=3.20
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

LABEL maintainer="sker-team"
LABEL description="Gateway service for sker platform"
LABEL org.opencontainers.image.source="https://github.com/sker-team/sker"
LABEL org.opencontainers.image.version="1.0.0"

WORKDIR /app

# 安装 pnpm、node-gyp 和构建工具
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION} node-gyp && \
    apk add --no-cache python3 make g++

# 复制工作区配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制所有 package.json 文件
COPY packages/gateway/package.json ./packages/gateway/
COPY packages/models/package.json ./packages/models/
COPY packages/config/package.json ./packages/config/
COPY packages/broker/package.json ./packages/broker/
COPY packages/store/package.json ./packages/store/
COPY packages/store-client/package.json ./packages/store-client/
COPY packages/engine/package.json ./packages/engine/

# 安装所有依赖（使用缓存挂载）
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# 复制根目录 tsconfig.json
COPY tsconfig.json ./

# 复制所有依赖包的源代码和配置文件
COPY packages/config/src/ ./packages/config/src/
COPY packages/config/tsup.config.ts ./packages/config/tsup.config.ts
COPY packages/config/tsconfig.json ./packages/config/tsconfig.json

COPY packages/models/src/ ./packages/models/src/
COPY packages/models/tsup.config.ts ./packages/models/tsup.config.ts
COPY packages/models/tsconfig.json ./packages/models/tsconfig.json

COPY packages/store/src/ ./packages/store/src/
COPY packages/store/tsup.config.ts ./packages/store/tsup.config.ts
COPY packages/store/tsconfig.json ./packages/store/tsconfig.json

COPY packages/store-client/src/ ./packages/store-client/src/
COPY packages/store-client/tsup.config.ts ./packages/store-client/tsup.config.ts
COPY packages/store-client/tsconfig.json ./packages/store-client/tsconfig.json

COPY packages/broker/src/ ./packages/broker/src/
COPY packages/broker/tsup.config.ts ./packages/broker/tsup.config.ts
COPY packages/broker/tsconfig.json ./packages/broker/tsconfig.json

COPY packages/engine/src/ ./packages/engine/src/
COPY packages/engine/tsup.config.ts ./packages/engine/tsup.config.ts
COPY packages/engine/tsconfig.json ./packages/engine/tsconfig.json

COPY packages/gateway/src/ ./packages/gateway/src/
COPY packages/gateway/tsup.config.ts ./packages/gateway/tsup.config.ts
COPY packages/gateway/tsconfig.json ./packages/gateway/tsconfig.json

# 按依赖顺序构建包
RUN pnpm --filter @sker/config run build && \
    pnpm --filter @sker/models run build && \
    pnpm --filter @sker/store run build && \
    pnpm --filter @sker/store-client run build && \
    pnpm --filter @sker/broker run build && \
    pnpm --filter @sker/engine run build && \
    pnpm --filter @sker/gateway run build

# 生产阶段：运行时镜像
ARG NODE_VERSION=18.20.5
ARG ALPINE_VERSION=3.20
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runtime

WORKDIR /app

# 安装 pnpm
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S gateway -u 1001

# 复制工作区配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制包配置文件
COPY packages/gateway/package.json ./packages/gateway/
COPY packages/models/package.json ./packages/models/
COPY packages/config/package.json ./packages/config/
COPY packages/broker/package.json ./packages/broker/
COPY packages/store/package.json ./packages/store/
COPY packages/store-client/package.json ./packages/store-client/
COPY packages/engine/package.json ./packages/engine/

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制构建产物
COPY --from=builder --chown=gateway:nodejs /app/packages/config/dist/ ./packages/config/dist/
COPY --from=builder --chown=gateway:nodejs /app/packages/models/dist/ ./packages/models/dist/
COPY --from=builder --chown=gateway:nodejs /app/packages/store/dist/ ./packages/store/dist/
COPY --from=builder --chown=gateway:nodejs /app/packages/store-client/dist/ ./packages/store-client/dist/
COPY --from=builder --chown=gateway:nodejs /app/packages/broker/dist/ ./packages/broker/dist/
COPY --from=builder --chown=gateway:nodejs /app/packages/engine/dist/ ./packages/engine/dist/
COPY --from=builder --chown=gateway:nodejs /app/packages/gateway/dist/ ./packages/gateway/dist/

# 切换到gateway包目录
WORKDIR /app/packages/gateway

# 切换到非root用户
USER gateway

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# 运行应用
CMD ["node", "dist/server.js"]