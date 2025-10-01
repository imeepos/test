# 🚀 SKER 部署指南

本文档提供 SKER AI协作画布平台的完整部署指南，包括开发环境、测试环境和生产环境的部署方案。

## 📋 系统要求

### 最低要求
- **操作系统**: Linux (Ubuntu 20.04+), macOS (10.15+), Windows 10+
- **内存**: 4GB RAM
- **存储**: 10GB 可用空间
- **CPU**: 2 核心

### 推荐配置
- **内存**: 8GB+ RAM
- **存储**: 50GB+ SSD
- **CPU**: 4+ 核心
- **网络**: 稳定的互联网连接

### 依赖软件

| 软件 | 版本要求 | 用途 |
|------|----------|------|
| Node.js | 18.20.5 | JavaScript 运行时 |
| pnpm | 10.15.0 | 包管理器 |
| Docker | 20.0.0+ | 容器化 |
| Docker Compose | 2.0.0+ | 多容器编排 |
| PostgreSQL | 14.0+ | 主数据库 |
| Redis | 6.0+ | 缓存和会话存储 |
| RabbitMQ | 3.11+ | 消息队列 |
| Nginx | 1.27+ | 前端应用服务器 |

**注意**: Dockerfile 中的版本号已固定，确保构建一致性。

## 🐳 Docker 部署 (推荐)

### 快速开始

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd sker
   ```

2. **配置环境变量**
   ```bash
   cp config/env/.env.example .env
   ```

   编辑 `.env` 文件：
   ```env
   # 数据库配置
   DATABASE_URL=postgresql://sker:password@postgres:5432/sker
   REDIS_URL=redis://redis:6379
   RABBITMQ_URL=amqp://user:password@rabbitmq:5672

   # AI 服务配置
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # 应用配置
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=your_jwt_secret_key
   CORS_ORIGIN=http://localhost:3000

   # 文件存储
   UPLOAD_PATH=/app/uploads
   MAX_FILE_SIZE=10485760

   # 日志配置
   LOG_LEVEL=info
   LOG_FORMAT=combined
   ```

3. **启动服务**
   ```bash
   # 使用 Docker Compose 启动所有服务
   docker-compose up -d

   # 或使用脚本启动
   ./scripts/docker-start.sh prod
   ```

4. **自定义镜像构建**
   ```bash
   # 使用自定义版本构建
   docker build \
     --build-arg NODE_VERSION=20.0.0 \
     --build-arg PNPM_VERSION=9.0.0 \
     -f packages/gateway/Dockerfile \
     -t sker-gateway:custom .
   ```

5. **验证部署**
   ```bash
   # 检查服务状态
   docker-compose ps

   # 查看日志
   docker-compose logs -f

   # 访问应用
   curl http://localhost:3000/health
   ```

### Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 数据库服务
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: sker
      POSTGRES_USER: sker
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./packages/store/src/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sker -d sker"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 缓存服务
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 消息队列
  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: user
      RABBITMQ_DEFAULT_PASS: password
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmqctl", "status"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 数据存储服务
  sker-store:
    build:
      context: .
      dockerfile: packages/store/Dockerfile
    environment:
      - DATABASE_URL=postgresql://sker:password@postgres:5432/sker
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "3001:3001"

  # 消息代理服务
  sker-broker:
    build:
      context: .
      dockerfile: packages/broker/Dockerfile
    environment:
      - RABBITMQ_URL=amqp://user:password@rabbitmq:5672
      - REDIS_URL=redis://redis:6379
    depends_on:
      rabbitmq:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "3002:3002"

  # AI处理引擎
  sker-engine:
    build:
      context: .
      dockerfile: packages/engine/Dockerfile
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy
    ports:
      - "3003:3003"

  # API网关
  sker-gateway:
    build:
      context: .
      dockerfile: packages/gateway/Dockerfile
    environment:
      - NODE_ENV=production
      - PORT=3004
      - CORS_ORIGIN=http://localhost:3000
      - STORE_SERVICE_URL=http://sker-store:3001
      - BROKER_SERVICE_URL=http://sker-broker:3002
      - ENGINE_SERVICE_URL=http://sker-engine:3003
    depends_on:
      - sker-store
      - sker-broker
      - sker-engine
    ports:
      - "3004:3004"

  # 前端应用
  sker-studio:
    build:
      context: .
      dockerfile: apps/studio/Dockerfile
    environment:
      - NODE_ENV=production
      - VITE_API_URL=http://localhost:3004
      - VITE_WS_URL=ws://localhost:3004
    depends_on:
      - sker-gateway
    ports:
      - "3000:3000"

  # 插件开发平台
  sker-developer:
    build:
      context: .
      dockerfile: apps/developer/Dockerfile
    environment:
      - NODE_ENV=production
      - VITE_API_URL=http://localhost:3004
    depends_on:
      - sker-gateway
    ports:
      - "3005:3005"

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:

networks:
  default:
    driver: bridge
```

## 🔧 手动部署

### 1. 环境准备

**安装 Node.js 和 pnpm**
```bash
# 安装 Node.js (使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 安装 pnpm
npm install -g pnpm
```

**安装数据库服务**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib redis-server

# macOS
brew install postgresql redis rabbitmq

# 启动服务
sudo systemctl start postgresql
sudo systemctl start redis-server
sudo systemctl start rabbitmq-server
```

**配置数据库**
```sql
-- 创建数据库和用户
sudo -u postgres psql
CREATE USER sker WITH ENCRYPTED PASSWORD 'password';
CREATE DATABASE sker OWNER sker;
GRANT ALL PRIVILEGES ON DATABASE sker TO sker;
\q
```

### 2. 应用部署

**克隆和安装依赖**
```bash
git clone <repository-url>
cd sker
pnpm install
```

**配置环境变量**
```bash
cp config/env/.env.example .env
cp apps/studio/.env.example apps/studio/.env.local
cp apps/developer/.env.example apps/developer/.env.local
```

**数据库初始化**
```bash
# 运行数据库迁移
pnpm run migrate:deploy

# 初始化种子数据
pnpm run seed
```

**构建应用**
```bash
# 构建所有包和应用
pnpm run build
```

**启动服务 (开发模式)**
```bash
# 启动数据存储服务
pnpm run dev:store &

# 启动消息代理服务
pnpm run dev:broker &

# 启动AI处理引擎
pnpm run dev:engine &

# 启动API网关
pnpm run dev:gateway &

# 启动前端应用
pnpm run dev:studio &

# 启动插件开发平台
pnpm run dev:developer &
```

**启动服务 (生产模式)**
```bash
# 使用 PM2 管理进程
npm install -g pm2

# 启动所有服务
pm2 start ecosystem.config.js

# 监控服务状态
pm2 status
pm2 logs
```

### 3. PM2 配置

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'sker-store',
      script: 'packages/store/dist/index.js',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'sker-broker',
      script: 'packages/broker/dist/index.js',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    },
    {
      name: 'sker-engine',
      script: 'packages/engine/dist/index.js',
      cwd: process.cwd(),
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    },
    {
      name: 'sker-gateway',
      script: 'packages/gateway/dist/index.js',
      cwd: process.cwd(),
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3004
      }
    }
  ]
}
```

## 🌐 反向代理配置

### Nginx 配置

创建 `/etc/nginx/sites-available/sker`:

```nginx
upstream sker_gateway {
    server localhost:3004;
}

upstream sker_studio {
    server localhost:3000;
}

upstream sker_developer {
    server localhost:3005;
}

server {
    listen 80;
    server_name your-domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    # 主应用 (Studio)
    location / {
        proxy_pass http://sker_studio;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API 路由
    location /api/ {
        proxy_pass http://sker_gateway/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 连接
    location /socket.io/ {
        proxy_pass http://sker_gateway;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 插件开发平台
    location /developer/ {
        proxy_pass http://sker_developer/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://sker_studio;
    }

    # 文件上传大小限制
    client_max_body_size 50M;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/sker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ☁️ 云平台部署

### AWS 部署

**使用 AWS ECS 部署**

1. **创建 ECS 集群**
   ```bash
   aws ecs create-cluster --cluster-name sker-cluster
   ```

2. **构建和推送 Docker 镜像**
   ```bash
   # 创建 ECR 仓库
   aws ecr create-repository --repository-name sker/studio
   aws ecr create-repository --repository-name sker/gateway
   aws ecr create-repository --repository-name sker/engine
   aws ecr create-repository --repository-name sker/store
   aws ecr create-repository --repository-name sker/broker

   # 构建并推送镜像
   docker build -t sker/studio -f apps/studio/Dockerfile .
   docker tag sker/studio:latest 123456789012.dkr.ecr.us-west-2.amazonaws.com/sker/studio:latest
   docker push 123456789012.dkr.ecr.us-west-2.amazonaws.com/sker/studio:latest
   ```

3. **创建任务定义**
   ```json
   {
     "family": "sker-studio",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "1024",
     "memory": "2048",
     "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "sker-studio",
         "image": "123456789012.dkr.ecr.us-west-2.amazonaws.com/sker/studio:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/sker-studio",
             "awslogs-region": "us-west-2",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

### Kubernetes 部署

**创建命名空间和配置**
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: sker

---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: sker-config
  namespace: sker
data:
  NODE_ENV: "production"
  DATABASE_URL: "postgresql://sker:password@postgres:5432/sker"
  REDIS_URL: "redis://redis:6379"
  RABBITMQ_URL: "amqp://user:password@rabbitmq:5672"

---
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: sker-secrets
  namespace: sker
type: Opaque
stringData:
  OPENAI_API_KEY: "your_openai_api_key"
  ANTHROPIC_API_KEY: "your_anthropic_api_key"
  JWT_SECRET: "your_jwt_secret_key"
```

**数据库部署**
```yaml
# postgres.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: sker
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: sker
        - name: POSTGRES_USER
          value: sker
        - name: POSTGRES_PASSWORD
          value: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: sker
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

**应用部署**
```yaml
# sker-studio.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sker-studio
  namespace: sker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sker-studio
  template:
    metadata:
      labels:
        app: sker-studio
    spec:
      containers:
      - name: sker-studio
        image: your-registry/sker/studio:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: sker-config
        - secretRef:
            name: sker-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: sker-studio
  namespace: sker
spec:
  selector:
    app: sker-studio
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sker-ingress
  namespace: sker
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: sker-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sker-studio
            port:
              number: 80
```

## 🔍 监控和日志

### 健康检查端点

每个服务都提供健康检查端点：

```javascript
// 健康检查路由示例
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  })
})

app.get('/ready', async (req, res) => {
  try {
    // 检查数据库连接
    await db.query('SELECT 1')

    // 检查缓存连接
    await redis.ping()

    res.status(200).json({ status: 'ready' })
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message })
  }
})
```

### Prometheus 监控

**安装 Prometheus 客户端**
```bash
pnpm add prom-client
```

**添加指标收集**
```javascript
const client = require('prom-client')

// 创建默认指标
client.collectDefaultMetrics()

// 自定义指标
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
})

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route']
})

// 指标端点
app.get('/metrics', (req, res) => {
  res.set('Content-Type', client.register.contentType)
  res.end(client.register.metrics())
})
```

### 日志配置

**使用 Winston 记录日志**
```javascript
const winston = require('winston')

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'sker'
  },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})
```

## 🔧 故障排除

### 常见问题

**1. 数据库连接失败**
```bash
# 检查数据库状态
sudo systemctl status postgresql

# 检查连接
psql -h localhost -U sker -d sker

# 查看日志
sudo journalctl -u postgresql -f
```

**2. Redis 连接问题**
```bash
# 检查 Redis 状态
redis-cli ping

# 查看配置
redis-cli config get "*"

# 监控命令
redis-cli monitor
```

**3. 内存不足**
```bash
# 检查内存使用
free -h
docker stats

# 调整 Node.js 内存限制
node --max-old-space-size=4096 app.js
```

**4. 端口冲突**
```bash
# 查看端口使用
netstat -tlnp | grep :3000
lsof -i :3000

# 杀死进程
kill -9 $(lsof -t -i:3000)
```

### 日志分析

**查看应用日志**
```bash
# Docker 日志
docker-compose logs -f sker-studio

# PM2 日志
pm2 logs sker-studio

# 系统日志
journalctl -u sker-studio -f
```

**错误日志分析**
```bash
# 查找错误
grep -i error /var/log/sker/application.log

# 统计错误类型
awk '/ERROR/ {print $4}' /var/log/sker/application.log | sort | uniq -c
```

## 📊 性能优化

### 数据库优化

**PostgreSQL 配置优化**
```sql
-- postgresql.conf 调优
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

**索引优化**
```sql
-- 创建必要的索引
CREATE INDEX CONCURRENTLY idx_nodes_user_id ON nodes(user_id);
CREATE INDEX CONCURRENTLY idx_edges_source_id ON edges(source_id);
CREATE INDEX CONCURRENTLY idx_edges_target_id ON edges(target_id);

-- 分析表统计信息
ANALYZE nodes;
ANALYZE edges;
```

### Redis 优化

```redis
# redis.conf 优化配置
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 应用优化

**启用 Gzip 压缩**
```javascript
const compression = require('compression')
app.use(compression())
```

**设置缓存头**
```javascript
app.use('/static', express.static('public', {
  maxAge: '1y',
  etag: false
}))
```

**连接池优化**
```javascript
const pool = new Pool({
  host: 'localhost',
  user: 'sker',
  password: 'password',
  database: 'sker',
  min: 2,
  max: 20,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
})
```

## 🔐 安全配置

### HTTPS 配置

**Let's Encrypt 证书**
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

### 防火墙配置

```bash
# Ubuntu UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS/RHEL firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 环境变量保护

```bash
# 设置正确的文件权限
chmod 600 .env
chown app:app .env

# 使用密钥管理服务 (AWS Secrets Manager, HashiCorp Vault)
```

## 📈 扩展方案

### 水平扩展

**负载均衡配置**
```nginx
upstream sker_app {
    least_conn;
    server app1.example.com:3000 weight=3;
    server app2.example.com:3000 weight=2;
    server app3.example.com:3000 weight=1;
}
```

**数据库读写分离**
```javascript
const masterPool = new Pool({ host: 'master-db' })
const replicaPool = new Pool({ host: 'replica-db' })

// 写操作使用主库
async function writeQuery(sql, params) {
  return masterPool.query(sql, params)
}

// 读操作使用从库
async function readQuery(sql, params) {
  return replicaPool.query(sql, params)
}
```

### 缓存策略

**多级缓存**
```javascript
// L1: 内存缓存 (Node.js)
const NodeCache = require('node-cache')
const memoryCache = new NodeCache({ stdTTL: 600 })

// L2: Redis 缓存
const redis = require('redis')
const redisClient = redis.createClient()

async function getWithCache(key) {
  // 先查内存缓存
  let data = memoryCache.get(key)
  if (data) return data

  // 再查 Redis 缓存
  data = await redisClient.get(key)
  if (data) {
    memoryCache.set(key, JSON.parse(data))
    return JSON.parse(data)
  }

  // 最后查数据库
  data = await database.query(key)
  if (data) {
    redisClient.setex(key, 3600, JSON.stringify(data))
    memoryCache.set(key, data)
    return data
  }

  return null
}
```

## 🚨 备份和恢复

### 数据库备份

**自动备份脚本**
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DB_NAME="sker"
DB_USER="sker"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 创建备份
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/sker_backup_$TIMESTAMP.sql

# 压缩备份
gzip $BACKUP_DIR/sker_backup_$TIMESTAMP.sql

# 删除30天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# 上传到云存储 (可选)
aws s3 cp $BACKUP_DIR/sker_backup_$TIMESTAMP.sql.gz s3://your-backup-bucket/
```

**设置定时备份**
```bash
# 添加到 crontab
0 2 * * * /path/to/backup.sh
```

### 数据恢复

```bash
# 从备份恢复
gunzip sker_backup_20231230_020000.sql.gz
psql -U sker -d sker < sker_backup_20231230_020000.sql
```

## 📞 技术支持

如果在部署过程中遇到问题，可以通过以下方式获取帮助：

- **文档**: [https://docs.sker.com](https://docs.sker.com)
- **GitHub Issues**: [https://github.com/sker/sker/issues](https://github.com/sker/sker/issues)
- **社区论坛**: [https://community.sker.com](https://community.sker.com)
- **技术支持**: [support@sker.com](mailto:support@sker.com)

---

*本文档会持续更新，最新版本请参考在线文档。*