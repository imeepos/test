# @sker/research Docker 部署指南

## 🚀 快速开始

### 前置要求
- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB 可用内存
- 至少 10GB 可用磁盘空间

### 1. 环境配置

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件，填入必要的API密钥
# 重要：至少需要配置 OPENAI_API_KEY
```

### 2. 构建和启动

```bash
# 启动核心服务（在项目根目录）
cd ../..
docker-compose up -d postgres redis rabbitmq store broker engine gateway

# 启动研究应用（回到research目录）
cd apps/research
docker-compose -f docker-compose.research.yml up -d --build
```

### 3. 验证部署

访问以下地址验证服务状态：
- 🔬 研究应用: http://localhost:3000
- 🔧 API网关: http://localhost:8000
- 📚 学术API: http://localhost:3003
- 📊 统计计算: http://localhost:3004
- 📄 文档处理: http://localhost:3005

## 📋 服务架构

### 核心服务
| 服务名 | 端口 | 描述 |
|--------|------|------|
| research | 3000 | 研究应用前端 |
| gateway | 8000 | API网关 |
| postgres | 5432 | 数据库 |
| redis | 6379 | 缓存 |
| rabbitmq | 5672/15672 | 消息队列 |

### 学术专用服务
| 服务名 | 端口 | 描述 |
|--------|------|------|
| academic-api | 3003 | 学术数据库API |
| stats-compute | 3004 | 统计计算服务 |
| document-processor | 3005 | 文档处理服务 |

## 🔧 配置说明

### 必需环境变量
```env
# AI服务
OPENAI_API_KEY=your_openai_key

# 学术数据库
PUBMED_API_KEY=your_pubmed_key
CROSSREF_MAILTO=your_email@domain.com

# 数据库
DATABASE_URL=postgresql://sker_user:sker_password@postgres:5432/sker_db
REDIS_URL=redis://redis:6379
```

### 可选环境变量
```env
# 文件上传限制
MAX_FILE_SIZE=500MB
UPLOAD_DIR=./uploads

# 统计计算超时
STATS_TIMEOUT=1800

# 日志级别
LOG_LEVEL=info
```

## 🐳 Docker配置详解

### 多阶段构建
1. **Builder阶段**: 安装依赖，构建应用
   - Node.js 18 Alpine
   - Python 3 + R 环境
   - 学术计算包

2. **Production阶段**: 运行应用
   - Nginx Alpine
   - 优化的静态文件服务
   - 安全配置

### 存储卷
```yaml
volumes:
  research_uploads:    # 用户上传文件
  research_data:       # 研究数据
  academic_cache:      # 学术API缓存
  stats_data:          # 统计数据
  document_storage:    # 文档存储
```

## 🔒 安全配置

### Nginx安全头
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS)

### 限流配置
- API请求: 10 req/s
- 文件上传: 5 req/s
- 统计分析: 自定义限制

### 文件上传限制
- 最大文件大小: 500MB
- 支持格式: PDF, DOCX, TEX, CSV等学术格式
- 病毒扫描: 集成ClamAV (可选)

## 📊 监控和日志

### 健康检查
所有服务都配置了健康检查端点：
```bash
# 检查研究应用
curl http://localhost:3000/health

# 检查学术API
curl http://localhost:3003/health
```

### 日志查看
```bash
# 查看所有服务日志
docker-compose -f docker-compose.research.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.research.yml logs -f research
docker-compose -f docker-compose.research.yml logs -f academic-api
```

### 性能监控
- 内存限制: 各服务设置合适的内存限制
- CPU限制: 计算密集型服务限制CPU使用
- 磁盘监控: 监控存储卷使用情况

## 🛠️ 维护操作

### 更新应用
```bash
# 重新构建并更新
docker-compose -f docker-compose.research.yml up -d --build --no-deps research

# 重启特定服务
docker-compose -f docker-compose.research.yml restart academic-api
```

### 数据备份
```bash
# 备份PostgreSQL
docker exec sker_postgres pg_dump -U sker_user sker_db > backup.sql

# 备份Redis
docker exec sker_redis redis-cli BGSAVE

# 备份用户数据
docker cp sker-research:/var/www/uploads ./backup/uploads
```

### 清理操作
```bash
# 停止所有服务
docker-compose -f docker-compose.research.yml down

# 删除所有容器和卷（谨慎操作）
docker-compose -f docker-compose.research.yml down -v --remove-orphans

# 清理未使用的镜像
docker image prune -f
```

## 🚨 故障排除

### 常见问题

1. **研究应用无法启动**
   - 检查依赖服务是否健康
   - 验证环境变量配置
   - 查看应用日志

2. **学术API连接失败**
   - 验证API密钥配置
   - 检查网络连接
   - 确认API服务限额

3. **文件上传失败**
   - 检查文件大小限制
   - 验证文件格式支持
   - 确认存储空间

4. **统计分析超时**
   - 增加超时时间配置
   - 检查数据集大小
   - 监控内存使用

### 调试模式
```bash
# 启用调试日志
export LOG_LEVEL=debug

# 进入容器调试
docker exec -it sker-research sh
docker exec -it sker-academic-api sh
```

## 📈 生产环境部署

### SSL配置
```bash
# 生成SSL证书（Let's Encrypt）
certbot certonly --webroot -w /var/www/html -d research.yourdomain.com

# 配置SSL
cp ssl/cert.pem apps/research/ssl/
cp ssl/key.pem apps/research/ssl/
```

### 负载均衡
```yaml
# 多实例部署
research-1:
  # ... 配置
research-2:
  # ... 配置

nginx-lb:
  # 负载均衡配置
```

### 监控告警
- 集成 Prometheus + Grafana
- 配置 Sentry 错误追踪
- 设置服务可用性监控

## 📝 开发环境

### 本地开发
```bash
# 仅启动依赖服务
docker-compose up -d postgres redis rabbitmq

# 本地启动研究应用
cd apps/research
npm run dev
```

### 调试配置
```env
NODE_ENV=development
LOG_LEVEL=debug
DEV_MOCK_ACADEMIC_APIs=true
```

---

## ❓ 获取帮助

如遇到问题，请：
1. 查看日志文件
2. 检查服务状态
3. 验证配置文件
4. 参考故障排除指南

更多信息请参考项目文档或提交 Issue。