# Dockerfile 最佳实践

本文档记录 SKER 项目 Dockerfile 的最佳实践和编写规范。

## 📋 目录

- [核心原则](#核心原则)
- [版本管理](#版本管理)
- [构建优化](#构建优化)
- [安全实践](#安全实践)
- [元数据标准](#元数据标准)
- [检查清单](#检查清单)

## 核心原则

### 1. 多阶段构建

**必须**使用多阶段构建分离构建和运行环境：

```dockerfile
# 构建阶段
FROM node:18.20.5-alpine3.20 AS builder
WORKDIR /app
# 安装依赖、构建代码

# 运行阶段
FROM node:18.20.5-alpine3.20 AS runtime
WORKDIR /app
# 仅复制必要的运行时文件
```

**优势:**
- 镜像体积减少 60%+
- 不包含构建工具和开发依赖
- 提升安全性

### 2. 版本参数化

**必须**使用 ARG 参数化所有版本号：

```dockerfile
ARG NODE_VERSION=18.20.5
ARG ALPINE_VERSION=3.20
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder
```

**优势:**
- 统一版本管理
- 便于 CI/CD 集成
- 支持灵活构建

### 3. 层缓存优化

**必须**合并相关的 RUN 命令：

```dockerfile
# ❌ 错误：多个层
RUN pnpm --filter @sker/config run build
RUN pnpm --filter @sker/models run build
RUN pnpm --filter @sker/store run build

# ✅ 正确：单个层
RUN pnpm --filter @sker/config run build && \
    pnpm --filter @sker/models run build && \
    pnpm --filter @sker/store run build
```

## 版本管理

### 固定版本号

**必须**使用精确版本号，避免使用 `latest`:

```dockerfile
# ❌ 错误
FROM node:18-alpine
FROM nginx:alpine

# ✅ 正确
FROM node:18.20.5-alpine3.20
FROM nginx:1.27-alpine
```

### pnpm 版本

**必须**统一使用以下方式安装 pnpm:

```dockerfile
ARG PNPM_VERSION=10.15.0
RUN npm install -g pnpm@${PNPM_VERSION}
```

**注意:** 不要使用 `corepack` 方式（已废弃）

## 构建优化

### COPY 顺序

按依赖频率排序 COPY 指令，最大化缓存利用：

```dockerfile
# 1. 依赖文件（变化最少）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 2. package.json 文件
COPY packages/gateway/package.json ./packages/gateway/

# 3. 配置文件
COPY tsconfig.json ./

# 4. 源代码（变化最频繁）
COPY packages/gateway/src/ ./packages/gateway/src/
```

### COPY --chown

**必须**使用 `--chown` 避免额外的 chown 层：

```dockerfile
# ❌ 错误：需要额外的 RUN chown
COPY --from=builder /app/dist ./dist
RUN chown -R appuser:nodejs /app

# ✅ 正确：在 COPY 时设置所有权
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
```

### .dockerignore

**必须**配置 `.dockerignore` 减少构建上下文：

```
node_modules/
**/node_modules/
**/dist/
**/.git/
*.log
.env*
```

## 安全实践

### 非 root 用户

**必须**创建并使用非 root 用户运行应用：

```dockerfile
# 创建用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# 设置文件所有权
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist

# 切换用户
USER appuser
```

### 最小化依赖

**必须**在运行时镜像只安装生产依赖：

```dockerfile
# 运行时阶段
RUN pnpm install --prod --frozen-lockfile
```

### 健康检查

**必须**配置健康检查：

```dockerfile
# Node.js 服务（推荐）
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# 或使用 curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

## 元数据标准

### OCI 标准标签

**必须**添加 OCI 标准元数据标签：

```dockerfile
LABEL maintainer="sker-team"
LABEL description="Gateway service for sker platform"
LABEL org.opencontainers.image.source="https://github.com/sker-team/sker"
LABEL org.opencontainers.image.version="1.0.0"
```

## 检查清单

### 新建/修改 Dockerfile 时必查

- [ ] 使用多阶段构建
- [ ] 版本号参数化（NODE_VERSION, PNPM_VERSION 等）
- [ ] 固定所有基础镜像版本
- [ ] 合并 RUN 命令减少层数
- [ ] 使用 COPY --chown
- [ ] 创建非 root 用户
- [ ] 只安装生产依赖
- [ ] 配置健康检查
- [ ] 添加 OCI 标签
- [ ] 更新 .dockerignore

### 最佳实践检查

**高优先级:**
1. ✅ 无安全漏洞（无 root 用户运行）
2. ✅ 版本固定（避免意外更新）
3. ✅ 健康检查正常工作

**中优先级:**
4. ✅ 镜像体积优化（< 500MB）
5. ✅ 构建时间优化（< 5分钟）
6. ✅ 层数优化（< 15层）

**低优先级:**
7. ✅ 元数据完整
8. ✅ 注释清晰

## 示例模板

### Node.js 后端服务

```dockerfile
# 多阶段构建：构建阶段
ARG NODE_VERSION=18.20.5
ARG ALPINE_VERSION=3.20
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

LABEL maintainer="sker-team"
LABEL description="Your service description"
LABEL org.opencontainers.image.source="https://github.com/sker-team/sker"
LABEL org.opencontainers.image.version="1.0.0"

WORKDIR /app

# 安装 pnpm
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/your-service/package.json ./packages/your-service/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY tsconfig.json ./
COPY packages/your-service/ ./packages/your-service/

# 构建
RUN pnpm --filter @sker/your-service run build

# 生产阶段：运行时镜像
ARG NODE_VERSION=18.20.5
ARG ALPINE_VERSION=3.20
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runtime

WORKDIR /app

# 安装 pnpm 和工具
ARG PNPM_VERSION
RUN apk add --no-cache curl && \
    npm install -g pnpm@${PNPM_VERSION}

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/your-service/package.json ./packages/your-service/

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 复制构建产物
COPY --from=builder --chown=appuser:nodejs /app/packages/your-service/dist/ ./packages/your-service/dist/

WORKDIR /app/packages/your-service

# 切换用户
USER appuser

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# 启动应用
CMD ["node", "dist/server.js"]
```

### 前端应用（Nginx）

```dockerfile
ARG NODE_VERSION=18.20.5
ARG ALPINE_VERSION=3.20
ARG PNPM_VERSION=10.15.0

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

LABEL maintainer="sker-team"
LABEL description="Your app description"
LABEL org.opencontainers.image.source="https://github.com/sker-team/sker"
LABEL org.opencontainers.image.version="1.0.0"

WORKDIR /app

ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/your-app/package.json ./apps/your-app/

RUN pnpm install --frozen-lockfile

COPY apps/your-app/ ./apps/your-app/
RUN pnpm --filter @sker/your-app build

# 生产阶段
ARG NGINX_VERSION=1.27

FROM nginx:${NGINX_VERSION}-alpine AS production

RUN apk add --no-cache curl

COPY --from=builder /app/apps/your-app/dist /usr/share/nginx/html
COPY apps/your-app/nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/cache/nginx /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

EXPOSE 80
USER nginx

CMD ["nginx", "-g", "daemon off;"]
```

## 常见问题

### Q: 为什么不用 corepack?

A: `npm install -g pnpm@${PNPM_VERSION}` 更简单直接，与 CI/CD 兼容性更好。

### Q: 健康检查应该用 curl 还是 node?

A: 推荐使用 node 内置 http 模块（无需安装额外工具），curl 作为备选。

### Q: 如何减小镜像体积?

A:
1. 使用 alpine 基础镜像
2. 多阶段构建
3. 只安装生产依赖
4. 配置 .dockerignore

### Q: 构建缓存如何优化?

A:
1. 依赖文件先 COPY
2. 源代码后 COPY
3. 合并 RUN 命令
4. 利用 Docker BuildKit

## 相关文档

- [Docker 部署指南](../guides/DOCKER.md)
- [构建规范](BUILD_STANDARDS.md)
- [部署指南](../DEPLOYMENT.md)
