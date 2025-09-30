# 多阶段构建：构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制工作区配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制 broker 和所有依赖包的 package.json
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
COPY packages/config/vite.config.ts ./packages/config/vite.config.ts
COPY packages/config/tsconfig.json ./packages/config/tsconfig.json

# 复制 models 包的源代码和配置文件
COPY packages/models/src/ ./packages/models/src/
COPY packages/models/vite.config.ts ./packages/models/vite.config.ts
COPY packages/models/tsconfig.json ./packages/models/tsconfig.json

# 复制 store 包的源代码和配置文件
COPY packages/store/src/ ./packages/store/src/
COPY packages/store/tsconfig.json ./packages/store/tsconfig.json

# 复制 broker 包的源代码和配置文件
COPY packages/broker/src/ ./packages/broker/src/
COPY packages/broker/vite.config.ts ./packages/broker/vite.config.ts
COPY packages/broker/tsconfig.json ./packages/broker/tsconfig.json

# 按依赖顺序构建包
RUN pnpm --filter @sker/config run build
RUN pnpm --filter @sker/models run build
RUN pnpm --filter @sker/store run build
RUN pnpm --filter @sker/broker run build

# 生产阶段：运行时镜像
FROM node:18-alpine AS runtime

WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S broker -u 1001

# 安装 pnpm（仅生产环境）
RUN npm install -g pnpm

# 复制工作区配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制包配置文件
COPY packages/broker/package.json ./packages/broker/
COPY packages/models/package.json ./packages/models/
COPY packages/config/package.json ./packages/config/
COPY packages/store/package.json ./packages/store/

# 仅安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制构建产物
COPY --from=builder /app/packages/config/dist/ ./packages/config/dist/
COPY --from=builder /app/packages/models/dist/ ./packages/models/dist/
COPY --from=builder /app/packages/store/dist/ ./packages/store/dist/
COPY --from=builder /app/packages/broker/dist/ ./packages/broker/dist/

# 切换到broker包目录
WORKDIR /app/packages/broker

# 更改文件所有权
RUN chown -R broker:nodejs /app

# 切换到非root用户
USER broker

# 安装curl用于健康检查
USER root
RUN apk add --no-cache curl
USER broker

# 暴露端口（如果broker服务有HTTP端点）
EXPOSE 3002

# 健康检查：检查HTTP端点
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# 运行应用
CMD ["node", "dist/main.js"]