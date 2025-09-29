# SKER Backend Docker 部署指南

本文档说明如何使用 Docker 独立启动 SKER 后端服务。

## 📋 前置要求

- Docker Engine 20.0+
- Docker Compose 2.0+
- 至少 4GB 可用内存
- 至少 2GB 可用磁盘空间

## 🚀 快速启动

### 1. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**重要配置项：**
```bash
# 必须设置 OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# JWT 密钥（生产环境请更换）
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 2. 启动服务

#### 开发模式（仅启动基础设施）
```bash
# 启动 PostgreSQL、Redis、RabbitMQ
./scripts/docker-start.sh dev

# 然后本地启动各个服务进行开发
cd packages/store && pnpm run dev
cd packages/broker && pnpm run dev
cd packages/engine && pnpm run server:dev
cd packages/gateway && pnpm run dev
```

#### 生产模式（完整服务栈）
```bash
# 启动所有服务
./scripts/docker-start.sh prod
```

### 3. 验证部署

```bash
# 检查服务状态
./scripts/docker-start.sh status

# 查看服务日志
./scripts/docker-start.sh logs
```

## 🏗️ 架构说明

### 服务组件

| 服务 | 端口 | 描述 |
|------|------|------|
| **gateway** | 8000 | API 网关，统一入口 |
| **engine** | 8001 | AI 处理引擎 |
| **store** | 3001 | 数据存储服务 |
| **broker** | 3002 | 消息代理服务 |
| **postgres** | 5432 | PostgreSQL 数据库 |
| **redis** | 6379 | Redis 缓存 |
| **rabbitmq** | 5672/15672 | 消息队列/管理界面 |

### 服务依赖关系

```
Frontend → Gateway → Broker → Engine
                ↓       ↓       ↓
                Store ← Store ← Store
                  ↓
              PostgreSQL + Redis
                  ↑
                Broker → RabbitMQ
```

## 📁 Docker 文件结构

```
.
├── docker-compose.yml          # 生产环境编排
├── docker-compose.dev.yml      # 开发环境基础设施
├── .env.example               # 环境变量模板
├── scripts/docker-start.sh     # 启动脚本
└── packages/
    ├── store/Dockerfile       # 数据存储服务
    ├── gateway/Dockerfile     # API 网关服务
    ├── broker/Dockerfile      # 消息代理服务
    └── engine/Dockerfile      # AI 引擎服务
```

## 🔧 配置说明

### 环境变量

```bash
# OpenAI 配置
OPENAI_API_KEY=sk-...                    # 必填

# 认证配置
JWT_SECRET=your-jwt-secret               # 建议 32 字符以上

# 数据库配置（容器间通信）
DATABASE_URL=postgresql://sker_user:sker_password@postgres:5432/sker_db
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://sker_user:sker_password@rabbitmq:5672

# 开发环境配置（本地开发）
DEV_DATABASE_URL=postgresql://sker_dev_user:sker_dev_password@localhost:5432/sker_dev_db
DEV_REDIS_URL=redis://localhost:6379
DEV_RABBITMQ_URL=amqp://sker_dev_user:sker_dev_password@localhost:5672
```

### 数据持久化

数据通过 Docker volumes 持久化：

```bash
# 查看数据卷
docker volume ls | grep sker

# 数据卷位置
postgres_data      # PostgreSQL 数据
redis_data         # Redis 数据
rabbitmq_data      # RabbitMQ 数据
```

## 🛠️ 开发指南

### 本地开发模式

1. **启动基础设施**
   ```bash
   ./scripts/docker-start.sh dev
   ```

2. **本地启动服务**
   ```bash
   # 终端1：启动存储服务
   cd packages/store && pnpm run dev

   # 终端2：启动消息代理
   cd packages/broker && pnpm run dev

   # 终端3：启动AI引擎
   cd packages/engine && pnpm run server:dev

   # 终端4：启动API网关
   cd packages/gateway && pnpm run dev
   ```

3. **数据库初始化**
   ```bash
   cd packages/store
   pnpm run migrate
   pnpm run seed
   ```

### 服务调试

```bash
# 查看特定服务日志
docker-compose logs -f gateway
docker-compose logs -f engine
docker-compose logs -f store
docker-compose logs -f broker

# 进入容器调试
docker-compose exec gateway /bin/sh
docker-compose exec postgres psql -U sker_user -d sker_db
```

## 🚀 生产部署

### 安全考虑

1. **更换默认密码**
   ```bash
   # 修改数据库密码
   POSTGRES_PASSWORD=your-secure-password

   # 修改 RabbitMQ 密码
   RABBITMQ_DEFAULT_PASS=your-secure-password

   # 修改 JWT 密钥
   JWT_SECRET=your-super-secure-jwt-secret-key
   ```

2. **网络安全**
   ```bash
   # 只暴露必要端口
   # 考虑使用反向代理（Nginx）
   # 启用 HTTPS
   ```

3. **资源限制**
   ```yaml
   # 在 docker-compose.yml 中添加资源限制
   services:
     gateway:
       deploy:
         resources:
           limits:
             cpus: '1.0'
             memory: 1G
   ```

### 监控和日志

```bash
# 健康检查
curl http://localhost:8000/health
curl http://localhost:8001/health

# 系统监控
docker stats

# 日志管理
docker-compose logs --tail=100 -f
```

## 🔄 维护操作

### 服务管理

```bash
# 重启特定服务
docker-compose restart gateway

# 更新服务（重新构建）
docker-compose build gateway
docker-compose up -d gateway

# 扩展服务实例
docker-compose up -d --scale gateway=3
```

### 数据管理

```bash
# 备份数据库
docker exec -t sker_postgres_1 pg_dumpall -c -U sker_user > backup.sql

# 恢复数据库
cat backup.sql | docker exec -i sker_postgres_1 psql -U sker_user

# 清理数据（危险操作）
./scripts/docker-start.sh clean
```

## 🐛 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :8000

   # 修改 docker-compose.yml 中的端口映射
   ports:
     - "8080:8000"  # 改为其他端口
   ```

2. **内存不足**
   ```bash
   # 增加 Docker 内存限制
   # 或减少服务实例数量
   ```

3. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose logs postgres

   # 验证连接
   docker-compose exec postgres psql -U sker_user -d sker_db -c "SELECT 1;"
   ```

4. **消息队列连接失败**
   ```bash
   # 检查 RabbitMQ 状态
   docker-compose logs rabbitmq

   # 访问管理界面
   open http://localhost:15672
   ```

### 日志级别

```bash
# 设置详细日志
export NODE_ENV=development

# 生产环境静默模式
export NODE_ENV=production
```

## 📚 API 端点

服务启动后可访问：

- **API 网关**: http://localhost:8000
  - `/api/nodes` - 节点管理
  - `/api/ai` - AI 服务
  - `/api/projects` - 项目管理
  - `/api/auth` - 认证服务

- **AI 引擎**: http://localhost:8001
  - `/generate` - 内容生成
  - `/optimize` - 内容优化
  - `/analyze` - 语义分析

- **管理界面**:
  - RabbitMQ: http://localhost:15672 (用户名/密码: sker_user/sker_password)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 修改 Dockerfile 或 docker-compose.yml
4. 测试容器构建和运行
5. 提交 Pull Request

---

💡 **提示**: 首次启动可能需要较长时间下载镜像，请耐心等待。

🆘 **获取帮助**: 如遇问题请查看项目 Issues 或创建新的 Issue。