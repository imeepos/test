# 多阶段构建：构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制工作区配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制 broker package.json（broker包没有workspace依赖）
COPY packages/broker/package.json ./packages/broker/

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 复制根目录 tsconfig.json
COPY tsconfig.json ./

# 复制 broker 包的源代码和配置文件
COPY packages/broker/src/ ./packages/broker/src/
COPY packages/broker/vite.config.ts ./packages/broker/vite.config.ts
COPY packages/broker/tsconfig.json ./packages/broker/tsconfig.json

# 构建 broker 包
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

# 仅安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制构建产物
COPY --from=builder /app/packages/broker/dist/ ./packages/broker/dist/

# 切换到broker包目录
WORKDIR /app/packages/broker

# 更改文件所有权
RUN chown -R broker:nodejs /app

# 切换到非root用户
USER broker

# 暴露端口（如果broker服务有HTTP端点）
EXPOSE 3002

# 健康检查：检查进程是否存在
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD pgrep -f "node.*dist/index.js" > /dev/null || exit 1

# 运行应用
CMD ["node", "dist/index.js"]