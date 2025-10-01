# 多阶段构建：构建阶段
ARG NODE_VERSION=18.20.5
ARG ALPINE_VERSION=3.20
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

LABEL maintainer="sker-team"
LABEL description="Engine service for sker platform"
LABEL org.opencontainers.image.source="https://github.com/sker-team/sker"
LABEL org.opencontainers.image.version="1.0.0"

WORKDIR /app

# 安装指定版本的 pnpm
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}

# 复制工作区配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制所有需要的 package.json 文件（用于依赖解析）
COPY packages/engine/package.json ./packages/engine/
COPY packages/broker/package.json ./packages/broker/
COPY packages/models/package.json ./packages/models/
COPY packages/config/package.json ./packages/config/
COPY packages/store/package.json ./packages/store/

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 复制根目录 tsconfig.json
COPY tsconfig.json ./

# 复制 config 包的源代码和配置文件
COPY packages/config/src/ ./packages/config/src/
COPY packages/config/tsup.config.ts ./packages/config/tsup.config.ts
COPY packages/config/tsconfig.json ./packages/config/tsconfig.json

# 复制 models 包的源代码和配置文件
COPY packages/models/src/ ./packages/models/src/
COPY packages/models/tsup.config.ts ./packages/models/tsup.config.ts
COPY packages/models/tsconfig.json ./packages/models/tsconfig.json

# 复制 store 包的源代码和配置文件
COPY packages/store/src/ ./packages/store/src/
COPY packages/store/tsup.config.ts ./packages/store/tsup.config.ts
COPY packages/store/tsconfig.json ./packages/store/tsconfig.json

# 复制 broker 包的源代码和配置文件
COPY packages/broker/src/ ./packages/broker/src/
COPY packages/broker/tsup.config.ts ./packages/broker/tsup.config.ts
COPY packages/broker/tsconfig.json ./packages/broker/tsconfig.json

# 复制 engine 包的源代码和配置文件
COPY packages/engine/src/ ./packages/engine/src/
COPY packages/engine/tsup.config.ts ./packages/engine/tsup.config.ts
COPY packages/engine/tsconfig.json ./packages/engine/tsconfig.json

# 按正确顺序构建依赖包
RUN pnpm --filter @sker/config run build && \
    pnpm --filter @sker/models run build && \
    pnpm --filter @sker/store run build && \
    pnpm --filter @sker/broker run build && \
    pnpm --filter @sker/engine run build

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
    adduser -S engine -u 1001

# 复制工作区配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制包配置文件
COPY packages/engine/package.json ./packages/engine/
COPY packages/broker/package.json ./packages/broker/

# 仅安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制构建产物(使用 --chown)
COPY --from=builder --chown=engine:nodejs /app/packages/broker/dist/ ./packages/broker/dist/
COPY --from=builder --chown=engine:nodejs /app/packages/engine/dist/ ./packages/engine/dist/

# 切换到engine包目录
WORKDIR /app/packages/engine

# 切换到非root用户
USER engine

# 暴露端口
EXPOSE 8001

# 健康检查：检查HTTP服务
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# 运行应用
CMD ["node", "dist/server.es.js"]
