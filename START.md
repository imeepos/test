# SKER 后端启动指南

## 🚀 三种启动方式，选择最适合你的：

### 方式一：最简单 - 单体模式 ⭐️ 推荐新手
```bash
# 一条命令启动所有功能
npm run dev:all-in-one

# 访问: http://localhost:8000
```

### 方式二：开发模式 - 适合开发调试
```bash
# 1. 启动基础设施
./scripts/docker-start.sh dev

# 2. 启动应用服务
npm run dev:services
```

### 方式三：生产模式 - 适合生产部署
```bash
# 完整的容器化部署
./scripts/docker-start.sh prod
```

## ❓ 选择建议

| 场景 | 推荐方式 | 优点 | 缺点 |
|------|----------|------|------|
| **初次体验** | 单体模式 | 简单快速 | 功能有限 |
| **功能开发** | 开发模式 | 便于调试 | 需要本地环境 |
| **生产部署** | 生产模式 | 高可用，可扩展 | 复杂，资源消耗大 |

## 🔧 环境要求

**最低要求（单体模式）：**
- Node.js 18+
- 2GB 内存
- OPENAI_API_KEY

**完整要求（生产模式）：**
- Docker + Docker Compose
- 4GB+ 内存
- PostgreSQL、Redis、RabbitMQ

---

💡 **建议**：先用单体模式体验功能，需要扩展时再切换到微服务模式。