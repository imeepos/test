

语言：中文
包管理工具：pnpm
给子包装依赖：pnpm i --filter=@sker/xxx xxx


## 📚 文档导航

- [系统架构](docs/architecture/ARCHITECTURE.md) - 了解系统整体设计
- [部署指南](docs/DEPLOYMENT.md) - 完整的部署指南
- [微服务架构](docs/guides/README-MICROSERVICES.md) - 微服务部署
- [插件开发](docs/PLUGIN_DEVELOPMENT.md) - 插件开发指南
- [API参考](docs/API_REFERENCE.md) - API接口文档

## 🛠️ 开发工具

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建项目
pnpm build

# 运行测试
pnpm test

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint
```

## 单独运行单个子模块构建时使用

```bash
pnpm run --filter=@sker/xxx build
pnpm run --filter=@sker/xxx typecheck
pnpm run --filter=@sker/xxx lint
pnpm run --filter=@sker/xxx test
```
