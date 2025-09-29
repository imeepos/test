# 多阶段构建：构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制工作区配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制所有需要的 package.json 文件（用于依赖解析）
COPY packages/engine/package.json ./packages/engine/
COPY packages/broker/package.json ./packages/broker/

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 复制根目录 tsconfig.json
COPY tsconfig.json ./

# 复制 broker 包的源代码和配置文件
COPY packages/broker/src/ ./packages/broker/src/
COPY packages/broker/vite.config.ts ./packages/broker/vite.config.ts
COPY packages/broker/tsconfig.json ./packages/broker/tsconfig.json

# 复制 engine 包的源代码和配置文件
COPY packages/engine/src/ ./packages/engine/src/
COPY packages/engine/vite.config.ts ./packages/engine/vite.config.ts
COPY packages/engine/tsconfig.json ./packages/engine/tsconfig.json

# 按正确顺序构建依赖包
RUN pnpm --filter @sker/broker run build
RUN pnpm --filter @sker/engine run build

# 生产阶段：运行时镜像
FROM node:18-alpine AS runtime

WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S engine -u 1001

# 安装 pnpm（仅生产环境）
RUN npm install -g pnpm

# 复制工作区配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制包配置文件
COPY packages/engine/package.json ./packages/engine/
COPY packages/broker/package.json ./packages/broker/

# 仅安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制构建产物
COPY --from=builder /app/packages/broker/dist/ ./packages/broker/dist/
COPY --from=builder /app/packages/engine/dist/ ./packages/engine/dist/

# 切换到engine包目录
WORKDIR /app/packages/engine

# 更改文件所有权
RUN chown -R engine:nodejs /app

# 切换到非root用户
USER engine

# 暴露端口
EXPOSE 8000

# 健康检查：检查HTTP服务
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

# 运行应用
CMD ["node", "dist/server/index.js"]